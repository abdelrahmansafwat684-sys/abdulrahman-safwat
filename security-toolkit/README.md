# Security Review Toolkit 🛡️

**Three small, working Python checks:** HTTP response headers, TLS certificate expiry, and an **offline** GCP IAM policy review. Built for learning, transparent evidence and repeatable low-impact checks on **authorized** systems.

![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white) ![Dependencies](https://img.shields.io/badge/Dependencies-stdlib_only-brightgreen) ![Tests](https://img.shields.io/badge/Tests-offline-blue)

## Quick start

From the repository root:

```bash
cd security-toolkit
python -m unittest discover -s tests -v
```

No packages, API keys or cloud permissions are needed for offline tests.

## Commands

### HTTP headers — one request

```bash
python security_toolkit.py headers https://example.com/ --json
```

- Sends a **single HEAD request** to the exact URL you provide.
- Doesn't follow redirects, scan other paths, or download page content.
- Notes HSTS, nosniff, referrer policy, and conditional browser-document controls (CSP, framing).
- For a JSON API response, CSP/framing controls are *not automatically reported as missing vulnerabilities*.
- Some sites reject HEAD with 405; this tool does not automatically retry as GET.

### TLS certificate expiry — one connection

```bash
python security_toolkit.py tls example.com --warn-days 30 --json
```

- Connects once using the system CA trust store and hostname validation.
- Reports negotiated TLS version and certificate expiry.
- An invalid or expired certificate normally causes verification failure; it is **not silently bypassed**.
- Not a complete TLS cipher-suite audit.

### Google Cloud IAM — offline JSON only

```bash
python security_toolkit.py iam examples/sample_iam_policy.json --json
```

- Reads a **local JSON policy file** only; it never invokes GCP APIs.
- Highlights `allUsers`, `allAuthenticatedUsers`, and legacy primitive `roles/owner` or `roles/editor` grants for manual review.
- Policies are contextual, and findings are review signals, **not proof of vulnerabilities**.
- The example uses `.invalid` placeholder domains. Never publish raw client IAM exports.

### Example: obtaining an IAM policy *only when authorized*

Use the normal Google Cloud Console export flow or your organization's approved process. Keep exports outside public repositories. Feed a **sanitized** local copy into the offline command above.

## Tests and CI

The `tests/` folder includes **ten** offline unit tests, including content-aware header checks, expiration boundaries, conditioned IAM bindings and CLI execution. GitHub Actions tests Python 3.11, 3.12 and 3.13 with no network or cloud credentials required by the tests.

Workflow: [Security Toolkit Tests](../.github/workflows/security-toolkit-tests.yml).

## Intended limitations

- No crawling, port sweeps, exploit payloads, brute force, or cloud API requests.
- A check only examines the exact input provided; do not treat it as a penetration test.
- HTTP header presence is not the same as security effectiveness.
- IAM evaluation ignores role permissions, inheritance, deny policies and policy conditions except noting their presence.
- TLS checks depend on the local trust store and connectivity; no certificate revocation assessment.
- `--json` supports local reporting. Exit status is 0 on successful review even when observations need attention; 2 means a runtime or input error.

**Ethics:** Use only with explicit authorization; never commit credentials, real private IAM exports, confidential findings, or customer data.
