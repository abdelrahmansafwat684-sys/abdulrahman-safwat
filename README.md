# Abdulrahman Safwat | Cybersecurity Portfolio

**Cybersecurity Specialist · Web & API Security · Google Cloud Security · FinTech Security**

I work on protecting websites, APIs and cloud infrastructure through risk-based assessments, configuration reviews, vulnerability management and secure change procedures.

## Personal Cybersecurity Portfolio Website

**[Explore my full cybersecurity portfolio](https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat/portfolio/)** — responsive English-language professional website featuring all four public projects, source repositories, synthetic reports, and the CloudGuard live demo.

- [Website source](projects/cybersecurity-portfolio/) · [26 offline site tests](projects/cybersecurity-portfolio/tests/site.test.mjs)
- The website is deployed to the `/portfolio/` path through the shared GitHub Pages workflow; the original CloudGuard dashboard remains at the repository root.
- **Deployment must succeed before treating this new site address as live.** [View the Pages workflow](https://github.com/abdelrahmansafwat684-sys/abdulrahman-safwat/actions/workflows/cloudguard-pages.yml).

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

## GCP Security Automation — Read-Only Posture Auditor

**[GCP Security Automation](projects/gcp-security-automation/)** — a Python CLI for **explicitly authorized, read-only** Google Cloud configuration exports and offline risk triage. It reviews firewall ingress, external VM IPs, project IAM bindings and Cloud SQL access/TLS/backup indicators.

- **22 offline automated tests passed locally.** [Read the source and setup guide](projects/gcp-security-automation/README.md).
- [Inspect synthetic security findings report](projects/gcp-security-automation/examples/sample_report.md) and [fictional input data](projects/gcp-security-automation/examples/synthetic_inventory.json).
- Four hard-coded read-only `gcloud` commands, no change operations and no real client data in public GitHub.
- The findings are context-dependent *review signals* — **not** confirmed vulnerabilities, effective-access findings or PCI DSS/NCA compliance certification.

```bash
cd projects/gcp-security-automation
python -m unittest discover -s tests -v
python gcp_audit.py analyze --input examples/synthetic_inventory.json --output-dir private-data/demo-report
```

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
