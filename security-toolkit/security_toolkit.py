"""Small, dependency-free security review helpers for authorized assets.

No crawling, brute force, exploitation, credential access, or cloud API calls.
"""

from __future__ import annotations

import argparse
import datetime as dt
import http.client
import json
import socket
import ssl
import sys
from pathlib import Path
from urllib.parse import urlsplit

VERSION = "1.0.0"


def review_headers(headers: dict[str, str], scheme: str = "https") -> list[dict[str, str]]:
    """Review indicative HTTP response headers; findings need human validation."""
    h = {str(k).lower(): str(v) for k, v in headers.items()}
    html = any(value in h.get("content-type", "").lower() for value in ("text/html", "application/xhtml+xml"))
    results: list[dict[str, str]] = []

    def add(control: str, status: str, note: str) -> None:
        results.append({"control": control, "status": status, "note": note})

    if scheme == "https":
        if h.get("strict-transport-security", "").lower().startswith("max-age="):
            add("HSTS", "present", "Review max-age and subdomain policy for the deployment.")
        else:
            add("HSTS", "review", "No recognizable HSTS max-age; assess whether HSTS fits this host.")
    else:
        add("HSTS", "not_applicable", "HSTS must be delivered over HTTPS to be effective.")

    if h.get("x-content-type-options", "").strip().lower() == "nosniff":
        add("X-Content-Type-Options", "present", "nosniff is configured.")
    else:
        add("X-Content-Type-Options", "review", "Consider nosniff where supported.")

    if html:
        if h.get("content-security-policy", "").strip():
            add("CSP", "present", "Policy present; its effectiveness requires manual review.")
        else:
            add("CSP", "review", "HTML response has no Content-Security-Policy header.")
        csp = h.get("content-security-policy", "").lower()
        has_frame_rule = "frame-ancestors" in csp
        has_xfo = h.get("x-frame-options", "").strip().lower() in ("deny", "sameorigin")
        add("Framing protection", "present" if (has_frame_rule or has_xfo) else "review",
            "Inspect framing restrictions for this HTML page.")
    else:
        add("CSP", "not_applicable", "Browser document policy is not assessed for this non-HTML response.")
        add("Framing protection", "not_applicable", "Non-HTML response; review if it serves pages elsewhere.")

    if h.get("referrer-policy", "").strip():
        add("Referrer-Policy", "present", "Validate the chosen value for the product.")
    else:
        add("Referrer-Policy", "review", "Consider an explicit referrer policy for browser content.")
    return results


def inspect_http(url: str, timeout: float = 6.0) -> dict:
    """Send one HEAD request. Never follow redirects or read response bodies."""
    parsed = urlsplit(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Use an explicit http(s) URL without embedded credentials.")
    if not 0 < timeout <= 60:
        raise ValueError("Timeout must be in (0, 60] seconds.")
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    target = parsed.path or "/"
    if parsed.query:
        target += "?" + parsed.query
    connection_class = http.client.HTTPSConnection if parsed.scheme == "https" else http.client.HTTPConnection
    conn = connection_class(parsed.hostname, port=port, timeout=timeout)
    try:
        conn.request("HEAD", target, headers={"User-Agent": f"Authorized-Security-Review/{VERSION}"})
        response = conn.getresponse()
        # Combine repeated header fields for a short, diagnostic-only display.
        headers: dict[str, str] = {}
        for key, value in response.getheaders():
            key = key.lower()
            headers[key] = ", ".join(filter(None, (headers.get(key, ""), value)))
        return {
            "target": url,
            "method": "HEAD",
            "http_status": response.status,
            "redirect_location": headers.get("location") if 300 <= response.status < 400 else None,
            "checks": review_headers(headers, parsed.scheme),
            "notes": "Interpretation depends on content type, deployment architecture, and endpoint behavior.",
        }
    finally:
        conn.close()


def classify_expiration(not_after: dt.datetime, warn_days: int, now: dt.datetime | None = None) -> dict:
    if warn_days < 0:
        raise ValueError("warn_days must be non-negative.")
    now = now or dt.datetime.now(dt.timezone.utc)
    remaining = (not_after - now).total_seconds() / 86400
    status = "expired" if remaining <= 0 else "warning" if remaining <= warn_days else "valid"
    return {"status": status, "days_remaining": round(remaining, 1)}


def inspect_tls(host: str, port: int = 443, timeout: float = 6.0, warn_days: int = 30) -> dict:
    """Connect once, verify the remote certificate and inspect its expiry."""
    if not host or "://" in host or "/" in host or "@" in host or not 1 <= port <= 65535:
        raise ValueError("Provide a hostname (not a URL) and a TCP port from 1 to 65535.")
    if not 0 < timeout <= 60:
        raise ValueError("Timeout must be in (0, 60] seconds.")
    context = ssl.create_default_context()
    with socket.create_connection((host, port), timeout=timeout) as raw_socket:
        with context.wrap_socket(raw_socket, server_hostname=host) as secure_socket:
            peer = secure_socket.getpeercert()
            expiry = dt.datetime.fromtimestamp(
                ssl.cert_time_to_seconds(peer["notAfter"]), tz=dt.timezone.utc
            )
            classification = classify_expiration(expiry, warn_days)
            names = [name for kind, name in peer.get("subjectAltName", ()) if kind == "DNS"]
            return {
                "host": host,
                "port": port,
                "certificate_validated": True,
                "tls_version": secure_socket.version(),
                "expires_utc": expiry.isoformat(),
                "expiry": classification,
                "dns_san_count": len(names),
                "note": "CA and hostname validation passed for this connection; not a full TLS configuration audit.",
            }


def review_iam_policy(policy: dict) -> list[dict[str, str]]:
    """Offline review of GCP IAM policy bindings; no cloud requests."""
    if not isinstance(policy, dict):
        raise ValueError("Expected an IAM policy JSON object.")
    if "bindings" not in policy and isinstance(policy.get("policy"), dict):
        policy = policy["policy"]
    bindings = policy.get("bindings", [])
    if not isinstance(bindings, list):
        raise ValueError("IAM policy bindings must be an array.")
    findings: list[dict[str, str]] = []
    for index, binding in enumerate(bindings):
        if not isinstance(binding, dict):
            raise ValueError(f"Binding {index} must be an object.")
        role = binding.get("role", "")
        members = binding.get("members", [])
        if not isinstance(role, str) or not isinstance(members, list) or not all(isinstance(m, str) for m in members):
            raise ValueError(f"Binding {index}: role/members have invalid types.")
        conditional = "condition" in binding
        for member in members:
            if member in ("allUsers", "allAuthenticatedUsers"):
                findings.append({
                    "type": "broad_principal", "priority": "review", "role": role,
                    "member": member,
                    "detail": "Broad membership; verify resource context and business justification.",
                })
            if role in ("roles/owner", "roles/editor"):
                findings.append({
                    "type": "primitive_role", "priority": "review", "role": role,
                    "member": member,
                    "detail": ("Conditional binding: inspect condition and effective access."
                               if conditional else "Broad legacy role: review least privilege and necessity."),
                })
    return findings


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Small, non-invasive security checks for authorized systems."
    )
    sub = parser.add_subparsers(dest="command", required=True)
    headers = sub.add_parser("headers", help="Send one HEAD request; do not follow redirects")
    headers.add_argument("url", help="Explicit http(s) URL under your authorization")
    headers.add_argument("--timeout", type=float, default=6.0)
    headers.add_argument("--json", action="store_true")
    tls = sub.add_parser("tls", help="Verify TLS connection and certificate expiry")
    tls.add_argument("host", help="Hostname without https://")
    tls.add_argument("--port", type=int, default=443)
    tls.add_argument("--warn-days", type=int, default=30)
    tls.add_argument("--timeout", type=float, default=6.0)
    tls.add_argument("--json", action="store_true")
    iam = sub.add_parser("iam", help="Review local GCP IAM policy JSON offline")
    iam.add_argument("file", type=Path)
    iam.add_argument("--json", action="store_true")
    parser.add_argument("--version", action="version", version=VERSION)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if args.command == "headers":
            output = inspect_http(args.url, timeout=args.timeout)
        elif args.command == "tls":
            output = inspect_tls(args.host, args.port, args.timeout, args.warn_days)
        else:
            policy = json.loads(args.file.read_text(encoding="utf-8"))
            findings = review_iam_policy(policy)
            output = {"file": str(args.file), "checks": findings, "finding_count": len(findings),
                      "note": "Offline heuristic review; not evidence of a vulnerability or PCI DSS compliance."}
        print(json.dumps(output, indent=2, ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, ssl.SSLError, json.JSONDecodeError) as exc:
        print(f"Review failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
