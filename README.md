# Abdulrahman Safwat | Cybersecurity Portfolio

**Cybersecurity Specialist · Web & API Security · Google Cloud Security · FinTech Security**

I work on protecting websites, APIs and cloud infrastructure through risk-based assessments, configuration reviews, vulnerability management and secure change procedures.

## Featured Python Project

**[Security Review Toolkit v1.0](security-toolkit/)** — a dependency-free, read-only Python CLI that reviews HTTP headers, verifies TLS certificate expiry, and inspects sanitized GCP IAM policy files offline. Includes 10 unit tests and a GitHub Actions workflow targeting Python 3.11–3.13.

```bash
cd security-toolkit
python -m unittest discover -s tests -v
python security_toolkit.py iam examples/sample_iam_policy.json --json
```

The checks are non-exploitative; findings require context and human validation. Tests were run locally before publication.

## Public Security Guides

| Resource | What's inside |
| --- | --- |
| [Web & API Security Review Checklist](security-guides/web-api-security-checklist.md) | Authentication, authorization, API safety and finding template |
| [GCP Security Baseline](security-guides/gcp-security-baseline.md) | IAM, network exposure, workloads, logging and change control |
| [TLS & HTTP Security Checks](security-guides/tls-http-security-checks.md) | Safe verification examples and remediation validation |

## Areas of interest
- Application and API security (OWASP-aligned approaches)
- Google Cloud IAM, networking and hardening
- Vulnerability management and security reporting
- Secure operations and PCI DSS-related security controls

> These are generic public reference materials, not reports of a real environment. Assessment work is performed only with authorization; no private client information is published.

## Contact
- [GitHub profile](https://github.com/abdelrahmansafwat684-sys)
- [Email](mailto:abdelrahmansafwat684@gmail.com)
