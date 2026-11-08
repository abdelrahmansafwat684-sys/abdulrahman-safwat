# Case Study — CloudGuard: Cloud Security Posture Dashboard

**Project type:** Interactive cybersecurity portfolio demonstration  
**Author:** Abdulrahman Safwat  
**Deployment:** [CloudGuard live demo](https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat/)  
**Source:** [CloudGuard source and tests](./)  
**Snapshot date:** 8 November 2026

> **Transparency:** All findings, environments, assets, controls, owners, and security results in this project are fictional. The dashboard is not connected to Google Cloud or any production infrastructure and does not prove PCI DSS, NCA, or other regulatory compliance.

## 1. The problem

Cloud-security teams often need to transform a long list of technical observations into an actionable operational view: What is exposed? Which findings are urgent? Which control areas have the largest backlog? What can leadership act on today?

CloudGuard demonstrates a lightweight, browser-based way to organize those questions without requiring a backend, cloud credentials, or sensitive customer data.

## 2. What I built

A responsive single-page dashboard in HTML, CSS and vanilla JavaScript. It combines:

- Executive KPIs: active findings, critical items, overdue actions, exposed assets, and control pass rate
- Filters for environment, security control family, severity and free-text search
- Visual comparisons: severity distribution, risk concentration by control family and a seven-week reconstructed trend
- An operational priority queue with finding-level details and remediation ownership
- An assessment register with pass, partial, fail and not-assessed states
- Formula-safe CSV export of the **currently filtered findings**
- A repeatable Node.js test suite and GitHub Actions workflows for checks and Pages deployment

## 3. Architecture

```text
Synthetic data (data.mjs)
          |
          v
Pure analytics & validation (logic.mjs) ----> Node.js offline tests
          |
          v
Interactive views (app.mjs)
          |
          v
Responsive static UI (index.html + styles.css)
          |
          v
GitHub Actions checks --> GitHub Pages deployment
```

There is no backend, no authentication, no GCP API integration, no data exfiltration and no external JavaScript runtime dependency.

## 4. Demonstration snapshot

The project includes 24 **invented** findings across three hypothetical environments (production, staging and shared services) and 20 **invented** controls across six security domains.

| Demo metric | Synthetic result | Definition |
| --- | ---: | --- |
| Total findings in sample | 24 | All fictional finding records |
| Active findings | 20 | Unresolved as of the fixed snapshot |
| Critical active findings | 4 | Active records tagged Critical |
| Overdue actions | 12 | Active, overdue records excluding accepted risk |
| Distinct exposed assets | 6 | Unique public-exposure flags on active records |
| Controls assessed | 19 | Excludes one 'not assessed' record |
| Control pass rate | 32% | 6 passing / 19 assessed, rounded |

These figures illustrate how the dashboard performs calculations; **they are not observations from a real business**.

### Prioritization model

CloudGuard uses an explicit, **non-standard** score capped at 100: a severity-based base score plus synthetic indicators of internet exposure, payment criticality, exploitation and remediation lateness.

This is **not CVSS**. It is a demonstration of transparent, explainable prioritization; any real-world use would require validated vulnerability evidence, business-risk calibration, stakeholder-approved SLAs and human review.

## 5. Design choices and engineering safeguards

| Design choice | Why it matters |
| --- | --- |
| Fictional `.demo.invalid` hostnames | Keeps portfolio outputs isolated from real organizations |
| Deterministic snapshot date | Repeatable results for reviewers |
| Separate pure calculation module | Makes filtering, scoring and export independently testable |
| Environment and domain filters | Helps analysts focus their triage effort |
| Reconstructed weekly trend | Illustrates trend logic without claiming an actual data history |
| Accepted-risk handling | Avoids incorrectly presenting accepted risk as automatically remediated |
| CSV formula escaping | Reduces spreadsheet-formula injection risk in exports |
| Read-only public demo | No secrets, cloud account access or backend needed |
| Static GitHub Pages hosting | Easy to review and lightweight to maintain |

## 6. Quality checks and repeatability

The Node.js test suite includes **18 offline automated checks** covering fictional-data safety, date and status logic, scoring bounds, overdue calculations, filter semantics, summary reconciliation, unique asset counts, domain aggregation, trend consistency, operational queue ordering and CSV export safety.

```bash
cd projects/cloud-posture-dashboard
node --test tests/*.test.mjs
node --check app.mjs
node --check logic.mjs
```

The tests were executed locally and all 18 passed on 8 November 2026. The repository includes CI and deployment workflows; review the live GitHub Actions page for the current remote status.

## 7. How to review the live demonstration

1. Open the [live CloudGuard dashboard](https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat/).
2. Start with the overview metrics and severity distribution.
3. Filter to a single environment or security domain; confirm that the operational queue and summary change consistently.
4. Inspect a prioritized finding and review the control assessment register.
5. Export filtered findings as CSV and compare row scope against the table.

## 8. Limitations and next steps

- All data is simulated; findings are not validated vulnerabilities.
- No integration with GCP, Cloud Logging, Cloud Security Command Center, SIEM or scanners is implemented.
- The snapshot date is fixed and deliberately not refreshed from live data.
- The risk model should not be used as a compliance score or production risk engine.
- Future extensions could include a **private** data adapter, documented schemas, protected access, and audited data synchronization—only with organizational authorization and data-handling approval.

## 9. Short portfolio description

> **CloudGuard — Cloud Security Posture Dashboard:** Built a responsive, interactive security analytics dashboard using vanilla JavaScript, HTML and CSS. Implemented deterministic findings triage, security-control KPIs, risk visualization, filters, priority queues and safe CSV exports, supported by 18 offline automated tests and GitHub Pages deployment. All demonstration data is synthetic.

**Links:** [Live demo](https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat/) · [Source code](./) · [Tests](./tests/dashboard.test.mjs)
