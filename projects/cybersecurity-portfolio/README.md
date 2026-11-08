# Abdulrahman Safwat — Cybersecurity Portfolio Site

An original, responsive static website presenting four published, inspectable cybersecurity projects. Designed for recruiters, engineering managers, and authorized security collaborators.

## Preview locally

```bash
cd projects/cybersecurity-portfolio
python3 -m http.server 8000
# Visit http://localhost:8000
```

No build dependencies, API keys, user tracking, form submissions, or external runtime libraries. The navigation and filtering work in plain JavaScript; the layout supports desktop and mobile browsers.

## Live paths

- **Portfolio site:** `https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat/portfolio/`
- **CloudGuard dashboard (preserved):** `https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat/`

The repository's GitHub Pages workflow publishes the site at `/portfolio/`, while continuing to publish CloudGuard at the original root. A URL is considered live only after the deployment workflow succeeds and the page loads.

## Project links

| Project | Source | Evidence |
| --- | --- | --- |
| CloudGuard | [Source](../cloud-posture-dashboard/) | [Live dashboard](https://abdelrahmansafwat684-sys.github.io/abdulrahman-safwat/) · [Case study](../cloud-posture-dashboard/CASE_STUDY.md) |
| GCP Security Automation | [Source](../gcp-security-automation/) | [Fictional example report](../gcp-security-automation/examples/sample_report.md) |
| Vulnerability Triage Engine | [Source](../vulnerability-triage/) | [Fictional example report](../vulnerability-triage/examples/sample_executive_report.md) |
| Security Review Toolkit | [Source](../../security-toolkit/) | [Usage guide](../../security-toolkit/README.md) |

## Quality and accessibility

- Semantic navigation, landmarks, readable headings and skip link
- Visible keyboard focus states and reduced-motion preference
- Keyboard-operable filters with `aria-pressed` states
- Accessible mobile navigation with `aria-expanded`
- External URLs use `rel="noopener noreferrer"`
- Responsive layouts without external assets
- Node.js smoke tests for all four projects, links, meta information, and privacy disclosures

## Security and accuracy

All dashboards and example security observations are simulated; the site does not claim access to real environments or regulatory certification. Public content intentionally excludes customer names, private infrastructure identifiers, credentials, vulnerability evidence, and company-specific details. The site is a presentation of open-source demos; not a production security scanner.

**Author:** Abdulrahman Safwat. [GitHub](https://github.com/abdelrahmansafwat684-sys) · [Email](mailto:abdelrahmansafwat684@gmail.com).
