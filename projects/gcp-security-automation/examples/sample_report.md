# GCP Security Configuration Review

**Project:** example-security-demo
**Input type:** synthetic-demo-fixture

> **Scope limitation:** Heuristic review of selected exports. Results are not confirmed vulnerabilities or compliance findings.

## Summary

- Findings for human review: **8**
- Categories examined: **4/4**

## Coverage

| Dataset | Status |
| --- | --- |
| firewall_rules | reviewed |
| instances | reviewed |
| sql_instances | reviewed |
| iam_policy | reviewed |

## Review queue

| Rule | Severity | Area | Resource | Observation |
| --- | --- | --- | --- | --- |
| GCP-SQL-001 | high | Cloud SQL | demo-public-postgres | Cloud SQL authorized network allows all IPv4 sources |
| GCP-FW-001 | high | Firewall | demo-public-ssh | Unrestricted ingress source with sensitive TCP access |
| GCP-IAM-001 | high | IAM | roles/storage.objectViewer | Project policy includes broad principal |
| GCP-SQL-003 | medium | Cloud SQL | demo-public-postgres | Cloud SQL transport policy allows unencrypted connections |
| GCP-SQL-004 | medium | Cloud SQL | demo-public-postgres | Cloud SQL automated backups disabled |
| GCP-VM-001 | medium | Compute | demo-web-vm | VM has an external IPv4 address |
| GCP-FW-002 | medium | Firewall | demo-public-dev | Unrestricted ingress source to development-style port |
| GCP-IAM-002 | medium | IAM | user:demo-operator@example.invalid | Primitive project role requires least-privilege review |

## Action details

### 1. Cloud SQL authorized network allows all IPv4 sources — demo-public-postgres

**Rule:** GCP-SQL-001 · **Severity:** high

Instance has public IPv4 enabled and an authorized network covering 0.0.0.0/0. This requires reachability and authentication review.

**Suggested review:** Restrict authorized networks to approved sources or use private connectivity, following change approval.

### 2. Unrestricted ingress source with sensitive TCP access — demo-public-ssh

**Rule:** GCP-FW-001 · **Severity:** high

An enabled ALLOW ingress rule has a 0/0 source and grants broad or sensitive TCP ports. Effective reachability depends on target selectors, higher-priority rules and network context.

**Suggested review:** Review effective firewall policies and restrict source CIDRs, target resources and required ports after approval.

### 3. Project policy includes broad principal — roles/storage.objectViewer

**Rule:** GCP-IAM-001 · **Severity:** high

Member allUsers is bound to roles/storage.objectViewer; inspect effective scope and any conditions.

**Suggested review:** Validate authorization and inherited/effective policy before limiting access.

### 4. Cloud SQL transport policy allows unencrypted connections — demo-public-postgres

**Rule:** GCP-SQL-003 · **Severity:** medium

Reported IP configuration permits non-TLS connectivity; confirm actual client transports and applicable policies.

**Suggested review:** Assess enabling a suitable enforced TLS mode after application compatibility testing.

### 5. Cloud SQL automated backups disabled — demo-public-postgres

**Rule:** GCP-SQL-004 · **Severity:** medium

Backup configuration reports enabled=false; assess business continuity requirements.

**Suggested review:** Review recovery objectives and enable approved backup/recovery controls where required.

### 6. VM has an external IPv4 address — demo-web-vm

**Rule:** GCP-VM-001 · **Severity:** medium

Public IP presence is an exposure indicator, not proof of public accessibility; firewall and access policies must be checked.

**Suggested review:** Verify necessity of external IP; prefer approved ingress paths and private administrative access where feasible.

### 7. Unrestricted ingress source to development-style port — demo-public-dev

**Rule:** GCP-FW-002 · **Severity:** medium

An enabled ALLOW ingress rule has a 0/0 source and permits a commonly used application or development port.

**Suggested review:** Validate business need, target selectors, load-balancer path and restrict access if unnecessary.

### 8. Primitive project role requires least-privilege review — user:demo-operator@example.invalid

**Rule:** GCP-IAM-002 · **Severity:** medium

Role roles/editor granted to user:demo-operator@example.invalid. This is not an effective permissions calculation.

**Suggested review:** Assess least privilege, operational requirements, alternatives and conditional access.

## Important limitations

- No production changes or vulnerability exploitation are performed.
- Firewall rules are not effective reachability proofs; hierarchy, priorities and targeting are not reconciled.
- Project IAM bindings exclude inherited policies, deny rules and principal identity evaluation.
- Cloud SQL configuration signals are not a complete security or recovery assessment.
- Missing datasets are marked **not_assessed**; empty returned datasets are not proof of security.
- Keep real inventory snapshots and derived reports private and do not commit them publicly.
