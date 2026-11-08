"""Offline tests; no network access or cloud credentials required."""
import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path

from security_toolkit import classify_expiration, main, review_headers, review_iam_policy


class HeaderTests(unittest.TestCase):
    def test_html_missing_browser_headers(self):
        checks = review_headers({"Content-Type": "text/html; charset=utf-8"})
        status = {item["control"]: item["status"] for item in checks}
        self.assertEqual(status["HSTS"], "review")
        self.assertEqual(status["CSP"], "review")
        self.assertEqual(status["Framing protection"], "review")

    def test_html_protected_by_frame_ancestors(self):
        checks = review_headers({
            "Content-Type": "text/html",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        })
        status = {item["control"]: item["status"] for item in checks}
        self.assertTrue(all(s == "present" for s in status.values()))

    def test_json_api_not_flagged_as_missing_browser_csp(self):
        checks = review_headers({"Content-Type": "application/json"})
        status = {item["control"]: item["status"] for item in checks}
        self.assertEqual(status["CSP"], "not_applicable")
        self.assertEqual(status["Framing protection"], "not_applicable")

    def test_hsts_not_required_on_plain_http_response(self):
        checks = review_headers({}, scheme="http")
        self.assertEqual(checks[0]["status"], "not_applicable")


class TLSTests(unittest.TestCase):
    def test_expiry_warning_and_valid(self):
        now = dt.datetime(2026, 11, 8, tzinfo=dt.timezone.utc)
        result = classify_expiration(now + dt.timedelta(days=14), warn_days=30, now=now)
        self.assertEqual(result["status"], "warning")
        self.assertEqual(result["days_remaining"], 14)
        result = classify_expiration(now + dt.timedelta(days=60), warn_days=30, now=now)
        self.assertEqual(result["status"], "valid")

    def test_expired_and_invalid_window(self):
        now = dt.datetime(2026, 11, 8, tzinfo=dt.timezone.utc)
        self.assertEqual(classify_expiration(now, 30, now)["status"], "expired")
        with self.assertRaises(ValueError):
            classify_expiration(now, -1, now)


class IAMTests(unittest.TestCase):
    def test_flags_public_and_primitive_grants(self):
        policy = {"bindings": [
            {"role": "roles/viewer", "members": ["user:dev@example.invalid"]},
            {"role": "roles/owner", "members": ["user:admin@example.invalid"]},
            {"role": "roles/storage.objectViewer", "members": ["allUsers"]},
        ]}
        findings = review_iam_policy(policy)
        self.assertEqual(len(findings), 2)
        self.assertEqual({f["type"] for f in findings}, {"primitive_role", "broad_principal"})

    def test_conditions_and_wrapped_policy(self):
        policy = {"policy": {"bindings": [{
            "role": "roles/editor", "members": ["group:ops@example.invalid"],
            "condition": {"title": "temporary", "expression": "request.time < timestamp('2030-01-01T00:00:00Z')"},
        }]}}
        self.assertIn("Conditional", review_iam_policy(policy)[0]["detail"])

    def test_reject_malformed_bindings(self):
        with self.assertRaises(ValueError):
            review_iam_policy({"bindings": "not-an-array"})
        with self.assertRaises(ValueError):
            review_iam_policy({"bindings": [{"role": "roles/owner", "members": "allUsers"}]})

    def test_iam_cli_runs_without_cloud_credentials(self):
        with tempfile.TemporaryDirectory() as temp:
            file = Path(temp) / "policy.json"
            file.write_text(json.dumps({"bindings": [{"role": "roles/viewer", "members": ["allUsers"]}]}))
            self.assertEqual(main(["iam", str(file), "--json"]), 0)


if __name__ == "__main__":
    unittest.main()
