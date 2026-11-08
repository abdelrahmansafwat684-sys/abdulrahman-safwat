# GCP Security Automation — Read-Only Posture Auditor

![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white) ![Mode](https://img.shields.io/badge/Collection-Read_Only-16A085) ![Credentials](https://img.shields.io/badge/Offline_demo-No_Credentials-2EA44F) ![Data](https://img.shields.io/badge/Public_data-Synthetic_Only-835DF7)

**A reproducible Google Cloud security-review assistant with an offline mode and an explicitly authorized, read-only `gcloud` collection mode.** The project is designed to demonstrate how cloud configuration exports become an evidence-based, actionable review queue.

> **Important:** This is a **portfolio demonstration**, not a penetration test, effective-access evaluation, CVSS scorer, PCI DSS or NCA compliance audit. Findings are heuristic prompts for human validation. The published dataset and example reports are entirely **synthetic**.

## Capabilities

| Scope | Examples of review signals | Important limitation |
| --- | --- | --- |
| VPC firewall rules | Ingress `0.0.0.0/0` or `::/0` with sensitive TCP / development ports | No effective firewall policy hierarchy, target resolution, route or reachability analysis |
| Compute Engine | VMs with external IPv4 `natIP` | Public IP is not evidence of an exploitable service |
| Project IAM policy | Public project principal binding; `roles/owner` and `roles/editor` | Does not evaluate inherited policies, conditions, deny policies or permission effectiveness |
| Cloud SQL | Broad authorized networks; permissive SSL mode; disabled backups | Database security/recovery requires application, engine and environment context |

A missing dataset displays **not_assessed**, not "passed".

## 1) Offline demo — no GCP login needed

Python 3.11+ (standard library only):

```bash
cd projects/gcp-security-automation
python -m unittest discover -s tests -v
python gcp_audit.py analyze \
  --input examples/synthetic_inventory.json \
  --output-dir private-data/demo-report
```

Three local files are generated:

- `report.md` — management-oriented findings with suggested next actions
- `report.json` — machine-readable severity, coverage and findings
- `findings.csv` — spreadsheet-safe, sortable review queue

[View a safe, synthetic sample report](examples/sample_report.md).

The output directory **must be empty or new** to avoid overwriting prior evidence. Reports are created with owner-only file permissions where supported. The `.gitignore` rules help avoid accidental commits, but **do not replace private access controls or security reviews**.

## 2) Authorized live collection — opt-in only

Run this **only in a GCP project you are permitted to inspect**, from a trusted workstation or Cloud Shell with the Google Cloud CLI already authenticated. Choose an account with the **minimum read-only permissions** that can access the required APIs. This tool does **not** request credentials, perform login, impersonate another account or alter GCP settings.

```bash
python gcp_audit.py collect \
  --project YOUR-AUTHORIZED-GCP-PROJECT-ID \
  --output private-data/authorized-inventory.json

python gcp_audit.py analyze \
  --input private-data/authorized-inventory.json \
  --output-dir private-data/authorized-report
```

**Exactly four hard-coded `gcloud` read commands are used:**

```text
gcloud compute firewall-rules list --project=PROJECT --format=json --quiet
gcloud compute instances list --project=PROJECT --format=json --quiet
gcloud sql instances list --project=PROJECT --format=json --quiet
gcloud projects get-iam-policy PROJECT --format=json --quiet
```

`PROJECT` is validated before use. All subprocesses are launched using an **argument array, never a shell**. If any API request fails, collection aborts and **no partial export is written**. The collector is intentionally not scheduled or run automatically. It requires manual invocation and an authorized Google Cloud identity.

### Required access and boundaries

- Read access is needed for the selected Compute Engine, Cloud SQL and project IAM metadata; grant only what's needed and according to the organization's access policy.
- APIs must be enabled and the current `gcloud` account authorized; errors **do not** mean that resources are absent.
- Exports may contain sensitive topology, asset names, network locations and IAM principals. **Do not upload live exports or reports to public GitHub, chat, tickets or third-party services.** Use approved private storage, retention and deletion controls.
- Data collection in a production or regulated environment may need written approval, a change record or audit log even though commands are read-only.

## 3) Scoring and reporting

Heuristic categories use **high**, **medium** and **low** review priority. They are not CVSS scores and do not imply confirmed vulnerabilities. The analysis prints a brief aggregate summary and writes detailed observations only to local report files.

Example of a public demo finding:

```text
GCP-FW-001 — HIGH — demo-public-ssh
Unrestricted ingress source with sensitive TCP access
Action: Review effective firewall policies and restrict as approved.
```

Every fictional asset uses example or documentation-only names/IP ranges, not real client identifiers.

## Safeguards

- **No change operations:** no `set-*`, `create`, `update`, `delete`, firewall modification or SQL patch commands.
- **No credential ingestion:** no secrets, service-account keys or tokens accepted by the CLI.
- **No implicit network calls:** `analyze` only reads a local JSON file; `collect` is explicit.
- **Fail-closed data collection:** schema validation and required-API failures stop the workflow rather than reporting 'healthy'.
- **Safe rendering:** Markdown HTML escaping and CSV spreadsheet-formula neutralization.
- **No overwrites:** output files must be new, and raw data paths are ignored by Git.
- **Testable logic:** an offline test suite mocks Google Cloud command execution and never needs a real project.

## Source map

| Path | Description |
| --- | --- |
| [`gcp_audit.py`](gcp_audit.py) | CLI, four collection commands, review rules and reporting |
| [`examples/synthetic_inventory.json`](examples/synthetic_inventory.json) | Fabricated firewall, Compute Engine, IAM and Cloud SQL snapshots |
| [`examples/sample_report.md`](examples/sample_report.md) | A generated human-readable synthetic report |
| [`tests/test_gcp_audit.py`](tests/test_gcp_audit.py) | 22+ offline unit tests covering risk logic, report escaping and command safety |
| [GitHub Actions workflow](../../.github/workflows/gcp-audit-tests.yml) | Python matrix tests and a synthetic CLI smoke test |

## Known limitations

This project doesn't audit VPC firewall **hierarchical policies**, Cloud Armor, IAM **effective inheritance**, SCC, KMS, organization policy, cloud network routing, private service endpoints, service accounts or database user permissions. These are important gaps in any full cloud security review. Resources unavailable because of missing permissions must not be interpreted as secure; failed collection does not produce a report.

## References

- [Compute firewall rules list — Google Cloud SDK](https://docs.cloud.google.com/sdk/gcloud/reference/compute/firewall-rules/list)
- [Compute instances list — Google Cloud SDK](https://docs.cloud.google.com/sdk/gcloud/reference/compute/instances/list)
- [Cloud SQL instances list — Google Cloud SDK](https://docs.cloud.google.com/sdk/gcloud/reference/sql/instances/list)
- [Project IAM policy retrieval — Google Cloud SDK](https://docs.cloud.google.com/sdk/gcloud/reference/projects/get-iam-policy)
- [Cloud SQL SSL/TLS settings — Google Cloud documentation](https://docs.cloud.google.com/sql/docs/mysql/configure-ssl-instance)

## Author

Abdulrahman Safwat · [GitHub profile](https://github.com/abdelrahmansafwat684-sys) · **Public demo with synthetic data only.**
