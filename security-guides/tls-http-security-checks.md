# TLS & HTTP Security Headers — Safe Verification Notes

Replace `example.com` with a hostname **you own or are authorized to test**.

## Inspect HTTP response headers
```bash
curl --silent --show-error --head https://example.com/
```
Review relevant headers such as `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options` and `Referrer-Policy`. Correct policy depends on each application's design.

## Inspect certificate metadata
```bash
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -issuer -subject -dates
```
Check hostname coverage, issuing chain, expiration and ownership of renewal monitoring.

## Change/retest checklist
- [ ] Verify HTTP-to-HTTPS behavior and supported TLS policies.
- [ ] Confirm session cookie protection where applicable.
- [ ] Review browser and API compatibility before changing headers.
- [ ] Document timestamp, affected host, sanitized evidence and owner.
- [ ] Coordinate changes, test functionality and record a rollback plan.

These commands are **diagnostic examples**, not a complete security assessment or compliance certificate. Never publish access tokens, cookies or customer information.
