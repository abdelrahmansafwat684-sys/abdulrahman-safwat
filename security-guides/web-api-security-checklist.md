# Web & API Security — Authorized Review Checklist

A reusable checklist for **systems you own or are explicitly authorized to assess**. This is a general framework, not a penetration-test report or a claim of completed work.

## Scope and safeguards
- [ ] Obtain written authorization, scope, environment, dates and emergency contacts.
- [ ] Agree on testing boundaries, rate limits, rollback and escalation conditions.
- [ ] Use dedicated test users and synthetic, non-sensitive data.

## Authentication and sessions
- [ ] Review login, MFA where appropriate, logout, token expiry and revocation.
- [ ] Validate secure cookie settings and session handling.
- [ ] Ensure credentials and tokens are absent from code, logs and URLs.

## Authorization
- [ ] Confirm server-side checks for every sensitive API operation.
- [ ] Review object-level authorization, privileged functions and tenant isolation.
- [ ] Use separate low-privilege and admin test accounts.

## APIs and application logic
- [ ] Inventory endpoints and deprecated API versions.
- [ ] Review validation, output encoding and safe error handling.
- [ ] Validate CORS, rate limits and resource consumption controls.
- [ ] Review replay protections and idempotency for financial operations.
- [ ] Review dependencies and track relevant security advisories.

## Transport and monitoring
- [ ] Review HTTPS, TLS certificate validity and applicable security headers.
- [ ] Confirm important security events are logged without secrets.
- [ ] Track findings through remediation, retesting and closure.

## Finding record template

| Field | Value |
| --- | --- |
| Finding ID | |
| Authorized target / scope | |
| Observation timestamp | |
| Description | |
| Severity & rationale | |
| Sanitized evidence | |
| Recommended remediation | |
| Owner / due date | |
| Retest result | |

> Do not publish client data, endpoints, internal screenshots, credentials or production security configurations.
