# CloudGuard — Cloud Security Posture Dashboard

[![Static dashboard](https://img.shields.io/badge/Frontend-Vanilla_JS-83ebd9)](#run-locally) [![Tests](https://img.shields.io/badge/Tests-Node_22-7f99fb)](#automated-tests) [![Data](https://img.shields.io/badge/Data-100%25_synthetic-f7bf65)](#data-and-privacy)

An interactive, responsive security dashboard for a **fictional multi-environment cloud estate**. Designed as a public cybersecurity portfolio demonstration with no operational credentials or client data.

## Live demo & case study

**[🌐 Open CloudGuard dashboard](https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat/)** · **[Read the engineering case study](CASE_STUDY.md)** · [Check deployment status](https://github.com/abdelrahmansafwat684-sys/abdulrahman-safwat/actions/workflows/cloudguard-pages.yml)

The repository owner reported a successful GitHub Pages deployment. Public HTTP availability has not been independently confirmed by this documentation update.

## Preview

To view the dashboard, run a local server (ES module loading usually does not work from `file://`):

```bash
cd projects/cloud-posture-dashboard
python3 -m http.server 8000
# Open http://localhost:8000
```

On Windows with Python installed, use `py -m http.server 8000` instead.

## Features

- Overview KPIs: active findings, critical findings, overdue actions, distinct exposed assets, control pass rate.
- Filter by environment, control domain, severity, and finding text search.
- Severity donut, risk concentration by control domain, time-series trend reconstructed from fictional events.
- Priority queue and complete findings explorer with accessible detail dialog.
- Control assessment register with pass, partial, fail, and unassessed states.
- Safe CSV export of **exactly the currently filtered findings** (formula injection protection).
- Offline, zero-dependency test suite and automated CI on GitHub Actions.
- Responsive layout suitable for desktop, tablet and mobile.

## Architecture

| File | Purpose |
| --- | --- |
| `index.html` | Dashboard views, filters and semantic markup |
| `styles.css` | Responsive dark security-operations interface |
| `data.mjs` | Self-contained **fabricated** sample findings and controls |
| `logic.mjs` | Testable aggregation, filtering, scores and CSV export |
| `app.mjs` | Client-side interactions, charts, detail drawer and CSV download |
| `tests/dashboard.test.mjs` | Offline Node.js tests for calculations, data integrity, filters and exports |

There is no build step, external JavaScript dependency, secret, cloud API, scanner, or live data connection. The use of the word **Cloud** in the interface does not imply integration with GCP.

## Automated tests

```bash
node --test tests/*.test.mjs
node --check app.mjs
node --check logic.mjs
```

Tests run entirely offline and do not need elevated permissions, API keys, or network access.

## KPI definitions

- **Open findings**: discovered on/before 2026-11-08 without a resolution date on/before it; mitigated and accepted-risk records remain in the active backlog.
- **Critical**: active records classified Critical. This classification is synthetic, not a vulnerability scanner output.
- **Overdue actions**: active findings with due date before snapshot; accepted-risk items are excluded from overdue calculation, not from active inventory.
- **Exposed assets**: distinct asset names with `internetExposed: true` among the filtered active findings.
- **Control pass rate**: passing controls / all assessed controls. `not_assessed` is excluded from the denominator. The severity and search filters apply to findings **only**; environment and domain filters apply to both findings and controls.
- **Risk concentration**: sum of illustrative 0–100 point scores across currently active findings per control family. This is **not CVSS** and is not directly comparable with formal risk levels.
- **Trend**: seven fictional weekly snapshots recomputed from `discovered` and `resolved` dates (not real historical measurements); all finding filters are applied consistently.

### Illustrative risk score

`Critical 70 / High 50 / Medium 30 / Low 12` + `12` for exposed + `8` for payment-critical + `10` for a supplied exploited flag + `8` for overdue, capped at `100`. Resolved / not-yet-discovered findings score `0`.

This score **is not CVSS**, and this dashboard **does not assess PCI DSS or NCA compliance**. Policy thresholds and remediation dates are fictional and are not recommendations for actual environments.

## Data and privacy

All environments, assets, alerts, owners, dates and control results are **invented demonstration examples**. Asset names end with `.demo.invalid`. No customer data, production configurations, cloud project identifiers, security evidence, payment cardholder information or credentials are included. Never use public GitHub as a place for confidential security exports.

## GitHub Pages — publishing setup

### Troubleshooting: `Get Pages site failed — Not Found`

If the **Publish CloudGuard to GitHub Pages** workflow fails in `actions/configure-pages@v5` with a 404 or **Get Pages site failed**, this usually means the GitHub Pages site is not yet enabled. The Node.js deprecation notice in the run annotations is a warning, not the cause of this particular failure.

**Fix (repository admin):**

1. Open [Settings → Pages](https://github.com/abdelrahmansafwat684-sys/abdulrahman-safwat/settings/pages).
2. Under **Build and deployment**, choose **GitHub Actions** as the **Source**.
3. Return to the [deployment workflow](https://github.com/abdelrahmansafwat684-sys/abdulrahman-safwat/actions/workflows/cloudguard-pages.yml) and select **Run workflow** on `main`.
4. Confirm both `build` and `deploy` jobs succeed, then open **Visit site** from GitHub Pages settings.

Do not add `enablement: true` with the default `GITHUB_TOKEN`: the official `configure-pages` action requires a **different privileged token** for auto-enablement. Manual Pages activation is safer and avoids publishing a personal access token or adding privileged secrets.



This project includes the dedicated deployment workflow [`cloudguard-pages.yml`](../../.github/workflows/cloudguard-pages.yml). It tests the static dashboard and uploads **only** the public website files (`index.html`, `styles.css`, `app.mjs`, `data.mjs`, and `logic.mjs`). No secret, API, or production data is required.

**One-time repository-owner setup (if Pages is not enabled):**

1. Open [Repository Settings → Pages](https://github.com/abdelrahmansafwat684-sys/abdulrahman-safwat/settings/pages).
2. Under **Build and deployment → Source**, choose **GitHub Actions**. Ensure Actions are allowed for this repository.
3. Open [Publish CloudGuard to GitHub Pages](https://github.com/abdelrahmansafwat684-sys/abdulrahman-safwat/actions/workflows/cloudguard-pages.yml), choose **Run workflow** on `main` if no successful deployment appeared automatically.
4. Verify the build and deploy jobs are green. Only then should you use the site's public URL:

```text
https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat/
```

This is an **expected URL, not evidence of successful publication** until Pages reports a successful deployment and the page actually loads. The workflow also runs on changes to the website and deployment configuration on `main`.

**Note:** GitHub Pages is a public-facing host and not an access-controlled private environment. This project uses fully synthetic data.
## Author

Abdulrahman Safwat — [GitHub profile](https://github.com/abdelrahmansafwat684-sys) · Public cybersecurity portfolio project.
