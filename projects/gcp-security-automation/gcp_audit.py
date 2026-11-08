#!/usr/bin/env python3
"""Read-only GCP posture review: offline analysis or explicit gcloud collection.

This is an illustrative, scope-limited assessment aid, not a vulnerability scanner
or a substitute for authorization, effective-policy evaluation or compliance review.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import html
import ipaddress
import io
import json
import os
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Callable

PROJECT_PATTERN = re.compile(r"^[a-z][a-z0-9-]{4,28}[a-z0-9]$")
CATEGORIES = ("firewall_rules", "instances", "sql_instances", "iam_policy")
SENSITIVE_PORTS = {22, 23, 2375, 3389, 3306, 5432, 6379, 27017, 9200, 5601}
DEV_PORTS = {3000, 5000, 8000, 8080, 8888}
SORT_SEVERITY = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
SCHEMA_VERSION = 1
MAX_BYTES = 8 * 1024 * 1024


def public_anywhere(ranges: list[Any]) -> bool:
    """Only explicit unrestricted IPv4/IPv6 networks. Not a reachability proof."""
    for value in ranges:
        try:
            network = ipaddress.ip_network(str(value), strict=False)
        except ValueError:
            continue
        if network.prefixlen == 0:
            return True
    return False


def matches_any_port(ports: Any, interested: set[int]) -> bool:
    """Google firewall rule without ports matches all ports of IPProtocol."""
    if not ports:
        return True
    for entry in ports:
        chunk = str(entry)
        try:
            if "-" in chunk:
                first, last = map(int, chunk.split("-", 1))
                if first <= last and any(first <= port <= last for port in interested):
                    return True
            elif int(chunk) in interested:
                return True
        except (ValueError, TypeError):
            pass
    return False


def mkfinding(rule: str, severity: str, area: str, resource: str, title: str, detail: str, action: str) -> dict[str, str]:
    return {"rule": rule, "severity": severity, "area": area,
            "resource": str(resource), "title": title, "detail": detail, "recommendation": action}


def validate_inventory(obj: Any) -> dict[str, Any]:
    if not isinstance(obj, dict) or obj.get("schema_version") != SCHEMA_VERSION:
        raise ValueError("Expected inventory object with schema_version=1")
    project = obj.get("project")
    if not isinstance(project, str) or not project:
        raise ValueError("project must be a nonempty string")
    resources = obj.get("resources")
    if not isinstance(resources, dict):
        raise ValueError("resources must be an object")
    for name in CATEGORIES[:3]:
        if name in resources and not isinstance(resources[name], list):
            raise ValueError(f"resources.{name} must be a list")
    if "iam_policy" in resources and not isinstance(resources["iam_policy"], dict):
        raise ValueError("resources.iam_policy must be an object")
    return obj


def analyze(inventory: dict[str, Any]) -> dict[str, Any]:
    inventory = validate_inventory(inventory)
    resources = inventory["resources"]
    findings: list[dict[str, str]] = []
    coverage = {name: name in resources for name in CATEGORIES}

    for rule in resources.get("firewall_rules", []):
        if not isinstance(rule, dict) or rule.get("disabled") or rule.get("direction", "INGRESS").upper() != "INGRESS":
            continue
        # Source tags / service accounts only apply when sourceRanges is absent.
        ranges = rule.get("sourceRanges", [])
        if not isinstance(ranges, list) or not public_anywhere(ranges):
            continue
        allowed = rule.get("allowed", [])
        if not isinstance(allowed, list):
            continue
        name = str(rule.get("name", "unnamed-rule"))
        any_sensitive = False
        any_dev = False
        for entry in allowed:
            if not isinstance(entry, dict):
                continue
            protocol = str(entry.get("IPProtocol", "")).lower()
            ports = entry.get("ports")
            if protocol == "all" or (protocol == "tcp" and matches_any_port(ports, SENSITIVE_PORTS)):
                any_sensitive = True
            if protocol == "all" or (protocol == "tcp" and matches_any_port(ports, DEV_PORTS)):
                any_dev = True
        if any_sensitive:
            findings.append(mkfinding("GCP-FW-001", "high", "Firewall", name,
                "Unrestricted ingress source with sensitive TCP access",
                "An enabled ALLOW ingress rule has a 0/0 source and grants broad or sensitive TCP ports. Effective reachability depends on target selectors, higher-priority rules and network context.",
                "Review effective firewall policies and restrict source CIDRs, target resources and required ports after approval."))
        elif any_dev:
            findings.append(mkfinding("GCP-FW-002", "medium", "Firewall", name,
                "Unrestricted ingress source to development-style port",
                "An enabled ALLOW ingress rule has a 0/0 source and permits a commonly used application or development port.",
                "Validate business need, target selectors, load-balancer path and restrict access if unnecessary."))

    for vm in resources.get("instances", []):
        if not isinstance(vm, dict):
            continue
        public = any(isinstance(interface, dict) and any(
            isinstance(cfg, dict) and bool(cfg.get("natIP"))
            for cfg in interface.get("accessConfigs", []) if isinstance(interface.get("accessConfigs", []), list))
            for interface in vm.get("networkInterfaces", []) if isinstance(vm.get("networkInterfaces", []), list))
        if public:
            findings.append(mkfinding("GCP-VM-001", "medium", "Compute", vm.get("name", "unnamed-vm"),
                "VM has an external IPv4 address",
                "Public IP presence is an exposure indicator, not proof of public accessibility; firewall and access policies must be checked.",
                "Verify necessity of external IP; prefer approved ingress paths and private administrative access where feasible."))

    iam = resources.get("iam_policy", {})
    for binding in iam.get("bindings", []) if isinstance(iam.get("bindings", []), list) else []:
        if not isinstance(binding, dict):
            continue
        role = str(binding.get("role", ""))
        members = binding.get("members", [])
        if not isinstance(members, list):
            continue
        conditional = "condition" in binding
        for member in members:
            member = str(member)
            if member in {"allUsers", "allAuthenticatedUsers"}:
                findings.append(mkfinding("GCP-IAM-001", "high", "IAM", role,
                    "Project policy includes broad principal",
                    f"Member {member} is bound to {role}; inspect effective scope and any conditions.",
                    "Validate authorization and inherited/effective policy before limiting access."))
            if role in {"roles/owner", "roles/editor"}:
                findings.append(mkfinding("GCP-IAM-002", "medium", "IAM", member,
                    "Primitive project role requires least-privilege review",
                    f"Role {role} granted to {member}. {'Conditional binding must be evaluated. ' if conditional else ''}This is not an effective permissions calculation.",
                    "Assess least privilege, operational requirements, alternatives and conditional access."))

    for sql in resources.get("sql_instances", []):
        if not isinstance(sql, dict):
            continue
        name = str(sql.get("name", "unnamed-sql"))
        settings = sql.get("settings") or {}
        config = settings.get("ipConfiguration") or {}
        if not isinstance(config, dict):
            continue
        if config.get("ipv4Enabled") is True:
            networks = config.get("authorizedNetworks") or []
            broad = any(isinstance(n, dict) and public_anywhere([n.get("value", "")]) for n in networks) if isinstance(networks, list) else False
            if broad:
                findings.append(mkfinding("GCP-SQL-001", "high", "Cloud SQL", name,
                    "Cloud SQL authorized network allows all IPv4 sources",
                    "Instance has public IPv4 enabled and an authorized network covering 0.0.0.0/0. This requires reachability and authentication review.",
                    "Restrict authorized networks to approved sources or use private connectivity, following change approval."))
            else:
                findings.append(mkfinding("GCP-SQL-002", "low", "Cloud SQL", name,
                    "Cloud SQL public IPv4 interface present",
                    "Public IPv4 is enabled; authorized networks and connectivity need contextual review.",
                    "Validate public access business need and available private connectivity options."))
        mode = str(config.get("sslMode", "")).upper()
        if mode == "ALLOW_UNENCRYPTED_AND_ENCRYPTED" or (not mode and config.get("requireSsl") is False):
            findings.append(mkfinding("GCP-SQL-003", "medium", "Cloud SQL", name,
                "Cloud SQL transport policy allows unencrypted connections",
                "Reported IP configuration permits non-TLS connectivity; confirm actual client transports and applicable policies.",
                "Assess enabling a suitable enforced TLS mode after application compatibility testing."))
        backup = settings.get("backupConfiguration")
        if isinstance(backup, dict) and backup.get("enabled") is False:
            findings.append(mkfinding("GCP-SQL-004", "medium", "Cloud SQL", name,
                "Cloud SQL automated backups disabled",
                "Backup configuration reports enabled=false; assess business continuity requirements.",
                "Review recovery objectives and enable approved backup/recovery controls where required."))

    findings.sort(key=lambda x: (SORT_SEVERITY[x["severity"]], x["area"], x["resource"], x["rule"]))
    summary = dict(Counter(f["severity"] for f in findings))
    return {"schema_version": SCHEMA_VERSION, "project": inventory["project"],
            "source": inventory.get("source", "unspecified"),
            "coverage": {key: "reviewed" if value else "not_assessed" for key, value in coverage.items()},
            "summary": {"findings": len(findings), "by_severity": {key: summary.get(key, 0) for key in SORT_SEVERITY},
                        "coverage_reviewed": sum(coverage.values()), "coverage_total": len(coverage)},
            "disclaimer": "Heuristic configuration review only, not vulnerability verification, CVSS, PCI DSS or a complete GCP security assessment.",
            "findings": findings}


def markdown(report: dict[str, Any]) -> str:
    esc = lambda v: html.escape(str(v), quote=True).replace("|", "\\|").replace("\n", " ").replace("\r", " ")
    lines = ["# GCP Security Configuration Review", "", f"**Project:** {esc(report['project'])}",
             f"**Input type:** {esc(report['source'])}", "",
             "> **Scope limitation:** Heuristic review of selected exports. Results are not confirmed vulnerabilities or compliance findings.",
             "", "## Summary", "",
             f"- Findings for human review: **{report['summary']['findings']}**",
             f"- Categories examined: **{report['summary']['coverage_reviewed']}/{report['summary']['coverage_total']}**", "",
             "## Coverage", "", "| Dataset | Status |", "| --- | --- |"]
    for name, status in report["coverage"].items():
        lines.append(f"| {esc(name)} | {esc(status)} |")
    lines += ["", "## Review queue", "", "| Rule | Severity | Area | Resource | Observation |", "| --- | --- | --- | --- | --- |"]
    for item in report["findings"]:
        lines.append("| " + " | ".join(esc(item[k]) for k in ("rule", "severity", "area", "resource", "title")) + " |")
    if not report["findings"]:
        lines.append("| — | — | — | — | No observations in supplied datasets |")
    lines += ["", "## Action details", ""]
    for i, item in enumerate(report["findings"], 1):
        lines += [f"### {i}. {esc(item['title'])} — {esc(item['resource'])}", "",
                  f"**Rule:** {esc(item['rule'])} · **Severity:** {esc(item['severity'])}", "",
                  esc(item["detail"]), "", f"**Suggested review:** {esc(item['recommendation'])}", ""]
    lines += ["## Important limitations", "",
              "- No production changes or vulnerability exploitation are performed.",
              "- Firewall rules are not effective reachability proofs; hierarchy, priorities and targeting are not reconciled.",
              "- Project IAM bindings exclude inherited policies, deny rules and principal identity evaluation.",
              "- Cloud SQL configuration signals are not a complete security or recovery assessment.",
              "- Missing datasets are marked **not_assessed**; empty returned datasets are not proof of security.",
              "- Keep real inventory snapshots and derived reports private and do not commit them publicly.", ""]
    return "\n".join(lines)


def csv_output(report: dict[str, Any]) -> str:
    output = io.StringIO()
    fields = ["rule", "severity", "area", "resource", "title", "detail", "recommendation"]
    writer = csv.DictWriter(output, fieldnames=fields, lineterminator="\n")
    writer.writeheader()
    for item in report["findings"]:
        sanitized = {}
        for field in fields:
            value = str(item.get(field, ""))
            # Escape formulas for spreadsheet consumers, including leading whitespace.
            if value.lstrip(" \t\r\n").startswith(("=", "+", "-", "@")):
                value = "'" + value
            sanitized[field] = value
        writer.writerow(sanitized)
    return output.getvalue()


def private_write(path: Path, data: str) -> None:
    """Create new local file with owner-only permissions; refuse symlink/existing file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    fd = os.open(path, flags, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            stream.write(data)
    except BaseException:
        path.unlink(missing_ok=True)
        raise


def collect(project: str, runner: Callable[..., Any] = subprocess.run) -> dict[str, Any]:
    """Explicit read-only metadata collection. Requires a locally configured gcloud CLI."""
    if not PROJECT_PATTERN.fullmatch(project):
        raise ValueError("Specify a valid GCP project ID, without flags or punctuation")
    commands = {
        "firewall_rules": ["compute", "firewall-rules", "list", f"--project={project}", "--format=json", "--quiet"],
        "instances": ["compute", "instances", "list", f"--project={project}", "--format=json", "--quiet"],
        "sql_instances": ["sql", "instances", "list", f"--project={project}", "--format=json", "--quiet"],
        "iam_policy": ["projects", "get-iam-policy", project, "--format=json", "--quiet"],
    }
    resource = {}
    for name, command in commands.items():
        # The allowlist is hard-coded. Never use shell=True or mutate GCP resources.
        output = runner(["gcloud", *command], check=True, capture_output=True, text=True, timeout=90)
        try:
            value = json.loads(output.stdout)
        except json.JSONDecodeError as error:
            raise ValueError(f"gcloud returned invalid JSON for {name}") from error
        if name == "iam_policy":
            if not isinstance(value, dict):
                raise ValueError("Expected object for IAM policy")
        elif not isinstance(value, list):
            raise ValueError(f"Expected list for {name}")
        resource[name] = value
    return {"schema_version": SCHEMA_VERSION, "project": project, "source": "authorized-gcloud-export",
            "collected_at": dt.datetime.now(dt.timezone.utc).isoformat(), "resources": resource}


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="Read-only GCP posture review — private exports only")
    sub = root.add_subparsers(dest="command", required=True)
    c = sub.add_parser("collect", help="Opt-in read-only gcloud collection to local private file")
    c.add_argument("--project", required=True, help="Explicit GCP project ID")
    c.add_argument("--output", type=Path, default=Path("private-data/gcp-inventory.json"),
                   help="New local file (must not already exist)")
    a = sub.add_parser("analyze", help="Offline analysis of a local inventory JSON")
    a.add_argument("--input", required=True, type=Path)
    a.add_argument("--output-dir", type=Path, default=Path("private-data/reports"))
    return root


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        if args.command == "collect":
            inventory = collect(args.project)
            private_write(args.output, json.dumps(inventory, indent=2) + "\n")
            print("Saved an authorized metadata export locally; do not commit or share it publicly.")
        else:
            if args.input.stat().st_size > MAX_BYTES:
                raise ValueError("Input too large; max 8 MiB")
            report = analyze(json.loads(args.input.read_text(encoding="utf-8")))
            target = args.output_dir
            if target.exists() and any(target.iterdir()):
                raise FileExistsError("Output directory must be new or empty (avoid accidental overwrite)")
            private_write(target / "report.json", json.dumps(report, indent=2) + "\n")
            private_write(target / "report.md", markdown(report))
            private_write(target / "findings.csv", csv_output(report))
            print(f"Created 3 local reports for human review: {report['summary']['findings']} signals; "
                  f"coverage {report['summary']['coverage_reviewed']}/{report['summary']['coverage_total']}.")
        return 0
    except (OSError, ValueError, subprocess.CalledProcessError, subprocess.TimeoutExpired, TypeError) as exc:
        # Avoid printing raw gcloud stderr or commands: it can include private metadata.
        if isinstance(exc, subprocess.CalledProcessError):
            message = "gcloud collection failed (permissions, API or configuration); no inventory saved"
        else:
            message = f"{type(exc).__name__}: {exc}"
        print(f"Error: {message}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
