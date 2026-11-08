"""Offline tests: no GCP credentials or network access."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from gcp_audit import (analyze, collect, csv_output, main, markdown, matches_any_port,
                       private_write, public_anywhere, validate_inventory)

DEMO = json.loads((Path(__file__).resolve().parents[1] / "examples" / "synthetic_inventory.json").read_text())


class AnalyzeTests(unittest.TestCase):
    def test_sample_summary(self):
        result = analyze(DEMO)
        self.assertEqual(result["summary"]["findings"], 8)
        self.assertEqual(result["summary"]["coverage_reviewed"], 4)

    def test_sensitive_firewall(self):
        result = analyze(DEMO)
        self.assertIn("demo-public-ssh", [x["resource"] for x in result["findings"]])

    def test_web_443_only_not_flagged(self):
        result = analyze(DEMO)
        self.assertNotIn("demo-web-ingress", [x["resource"] for x in result["findings"]])

    def test_egress_and_disabled_ignored(self):
        fixture = {"schema_version": 1, "project": "example-test", "resources": {"firewall_rules": [
            {"name": "disabled", "disabled": True, "direction": "INGRESS", "sourceRanges": ["0.0.0.0/0"], "allowed": [{"IPProtocol": "all"}]},
            {"name": "egress", "direction": "EGRESS", "sourceRanges": ["0.0.0.0/0"], "allowed": [{"IPProtocol": "all"}]}
        ]}}
        self.assertEqual(analyze(fixture)["summary"]["findings"], 0)

    def test_explicit_ipv6_public(self):
        self.assertTrue(public_anywhere(["::/0"]))
        self.assertFalse(public_anywhere(["2001:db8::/32"]))
        self.assertFalse(public_anywhere(["invalid"] ))

    def test_port_ranges(self):
        self.assertTrue(matches_any_port(["20-25"], {22}))
        self.assertFalse(matches_any_port(["443"], {22}))
        self.assertTrue(matches_any_port([], {22}))

    def test_missing_coverage_not_pass(self):
        report = analyze({"schema_version": 1, "project": "test", "resources": {}})
        self.assertEqual(report["summary"]["findings"], 0)
        self.assertTrue(all(x == "not_assessed" for x in report["coverage"].values()))

    def test_reject_nonlist_inventory(self):
        with self.assertRaises(ValueError):
            validate_inventory({"schema_version": 1, "project": "example", "resources": {"firewall_rules": {}}})

    def test_reject_wrong_schema_version(self):
        with self.assertRaises(ValueError):
            validate_inventory({"schema_version": 5, "project": "example", "resources": {}})

    def test_iam_primitive_and_public(self):
        rules = [item["rule"] for item in analyze(DEMO)["findings"]]
        self.assertIn("GCP-IAM-001", rules)
        self.assertIn("GCP-IAM-002", rules)

    def test_sql_weak_tls_and_backups(self):
        rules = [item["rule"] for item in analyze(DEMO)["findings"]]
        for name in ("GCP-SQL-001", "GCP-SQL-003", "GCP-SQL-004"):
            self.assertIn(name, rules)

    def test_private_sql_not_flagged(self):
        report = analyze(DEMO)
        self.assertNotIn("demo-private-postgres", [x["resource"] for x in report["findings"]])

    def test_json_summary_matches_findings(self):
        report = analyze(DEMO)
        self.assertEqual(report["summary"]["findings"], sum(report["summary"]["by_severity"].values()))

    def test_report_has_explanation(self):
        md = markdown(analyze(DEMO))
        self.assertIn("not confirmed vulnerabilities", md)
        self.assertIn("## Coverage", md)
        self.assertIn("## Action details", md)

    def test_markdown_escapes_untrusted_data(self):
        obj = {"schema_version": 1, "project": "<example>", "resources": {"instances": [
            {"name": "| <script>alert(1)</script>", "networkInterfaces": [{"accessConfigs": [{"natIP": "203.0.113.10"}]}]}
        ]}}
        md = markdown(analyze(obj))
        self.assertIn("&lt;example&gt;", md)
        self.assertIn("\\| &lt;script&gt;", md)
        self.assertNotIn("<script>", md)

    def test_csv_formula_neutralization(self):
        obj = {"schema_version": 1, "project": "demo", "resources": {"instances": [
            {"name": "=SUM(1,2)", "networkInterfaces": [{"accessConfigs": [{"natIP": "203.0.113.10"}]}]}
        ]}}
        data = csv_output(analyze(obj))
        self.assertIn("'=SUM(1,2)", data)

    def test_file_permissions_and_exclusive_create(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "private-data" / "data.json"
            private_write(target, "{}")
            self.assertEqual(target.read_text(), "{}")
            with self.assertRaises(FileExistsError):
                private_write(target, "overwrite")
            if sys.platform != "win32":
                self.assertEqual(target.stat().st_mode & 0o777, 0o600)

    def test_cli_analysis_creates_reports(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "sample.json"
            source.write_text(json.dumps(DEMO), encoding="utf-8")
            out = Path(tmp) / "private-data" / "reports"
            self.assertEqual(main(["analyze", "--input", str(source), "--output-dir", str(out)]), 0)
            self.assertTrue((out / "report.md").exists())
            self.assertTrue((out / "report.json").exists())
            self.assertTrue((out / "findings.csv").exists())
            self.assertEqual(main(["analyze", "--input", str(source), "--output-dir", str(out)]), 2)


class CollectionTests(unittest.TestCase):
    def test_disallows_flag_injection_in_project(self):
        with self.assertRaises(ValueError):
            collect("--project=evil", runner=lambda *_args, **_kwargs: None)

    def test_collect_only_approved_read_operations(self):
        commands = []
        responses = [[], [], [], {"bindings": []}]
        def mock_run(command, **kwargs):
            commands.append(command)
            self.assertFalse(kwargs.get("shell", False))
            self.assertTrue(kwargs["check"])
            return SimpleNamespace(stdout=json.dumps(responses[len(commands) - 1]))
        obj = collect("example-security-demo", runner=mock_run)
        self.assertEqual(len(commands), 4)
        self.assertEqual(set(obj["resources"]), {"firewall_rules", "instances", "sql_instances", "iam_policy"})
        self.assertTrue(all("--format=json" in args for args in commands))
        self.assertFalse(any("delete" in args or "update" in args or "create" in args for args in commands))

    def test_failed_collection_fails_closed(self):
        def fail(_cmd, **_kwargs):
            raise subprocess.CalledProcessError(1, "gcloud")
        with self.assertRaises(subprocess.CalledProcessError):
            collect("example-security-demo", runner=fail)

    def test_bad_json_collection_fails_closed(self):
        with self.assertRaises(ValueError):
            collect("example-security-demo", runner=lambda *_a, **_k: SimpleNamespace(stdout="not-json"))


if __name__ == "__main__":
    unittest.main()
