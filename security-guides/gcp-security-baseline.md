# Google Cloud Security — Baseline Review

A generic reference checklist for **authorized** Google Cloud environments. Adapt it to your organization's architecture, threat model and formal change process. It does not establish that any environment is compliant or secure.

## Identity & governance
- [ ] Inventory projects, owners, service accounts and privileged identities.
- [ ] Review IAM roles and eliminate unnecessary permissions.
- [ ] Prefer workload identity and short-lived credentials to long-lived keys.
- [ ] Review relevant organization policies and administrator MFA.

## Exposure & network security
- [ ] Inventory internet-facing IPs, services and firewall rules.
- [ ] Route application traffic through approved load balancers and gateways.
- [ ] Restrict direct administrative access; consider Identity-Aware Proxy.
- [ ] Review Cloud Armor, network segmentation, ingress/egress and logging.

## Data & workloads
- [ ] Review Cloud SQL access, SSL/TLS settings and backup recovery processes.
- [ ] Review VM patching, vulnerability exposure and service account privileges.
- [ ] Use approved secret storage and least-privilege deployment identities.
- [ ] Validate certificate lifecycle ownership and renewal alerts.

## Monitoring & response
- [ ] Review audit logging, alerting and retention requirements.
- [ ] Track exceptional permissions and changes to public exposure.
- [ ] Test response and recovery playbooks using approved scenarios.

## Safe change workflow
1. Capture a current baseline and identify affected business services.
2. Document risk, approvals, rollback and maintenance window.
3. Coordinate with service owners before implementation.
4. Apply and validate changes with functional checks and monitoring.
5. Record evidence, exceptions, owner and follow-up action.

| Control | Review status | Evidence (private reference) | Owner |
| --- | --- | --- | --- |
| Least-privilege IAM | Not reviewed | | |
| Internet exposure | Not reviewed | | |
| Cloud SQL transport | Not reviewed | | |
| Audit logging | Not reviewed | | |
| Vulnerability management | Not reviewed | | |

> Keep internal project IDs, asset inventories, IP lists, firewall details and customer data private.
