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

## Featured Project: Vulnerability Triage & Reporting Engine

**[Vulnerability Triage & Reporting Engine](projects/vulnerability-triage/)** — a standalone, offline Python CLI with 16 passing local tests. It accepts a structured findings list, ranks remediation priority using an explicitly illustrative risk model, tracks deadlines and produces Markdown, JSON and CSV reports. [View a synthetic executive report](projects/vulnerability-triage/examples/sample_executive_report.md).

```bash
cd projects/vulnerability-triage
python -m unittest discover -s tests -v
python triage.py --input examples/sample_findings.json --as-of 2026-11-08 --format markdown
```

The example does not use customer data; the scoring model is not CVSS, PCI DSS, or a compliance assessment.

## Interactive Cloud Security Dashboard

**[🌐 Open CloudGuard — interactive demo](https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat/)** · [Engineering case study](projects/cloud-posture-dashboard/CASE_STUDY.md) · [GitHub Actions](https://github.com/abdelrahmansafwat684-sys/abdulrahman-safwat/actions/workflows/cloudguard-pages.yml)



**[CloudGuard — Cloud Security Posture Dashboard](projects/cloud-posture-dashboard/)** — a responsive, self-contained browser dashboard with simulated cloud security findings, control assessments, risk visualization, filtering, action queues, and CSV export. Includes 18 passing offline tests and a CI workflow.

- [Live CloudGuard demo](https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat/) · [Open standalone HTML source](projects/cloud-posture-dashboard/standalone.html) — save and open locally to interact with the full dashboard.
- [See code and local run instructions](projects/cloud-posture-dashboard/README.md).
- All data is fictional; this is a demonstration, not evidence of a live assessment or PCI DSS compliance.

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
