# Security Policy — krumek

## Scope
This project is a public static network-planning simulation with optional Cloudflare Pages Functions and D1 endpoints for announcements and audit records.

## Reporting
Do not publish credentials, private student/staff data, real network secrets, or exploitable details in public Issues. Contact the repository owner through a private channel.

## Security practices
- Never store credentials, API keys, private keys, `.env`, or `.dev.vars` in Git.
- Treat all browser-side JavaScript, HTML, and simulation data as public.
- Enforce authentication and role authorization in Pages Functions for every admin API request.
- Keep Cloudflare Access policies on both `/admin/*` and `/api/admin/*`.
- Verify Access JWT signatures, issuer, audience, and time claims server-side.
- Use prepared SQL statements and validate request bodies.
- Use same-origin checks for state-changing browser requests.
- Keep audit logs append-only through the application API.
- Test CSP in Report-Only before enforcing.
- Test changes on Preview deployments before Production.
- Keep independent backups and test restoration.

## Incident response
1. Disable compromised credentials or Access sessions.
2. Rotate any exposed API keys or secrets.
3. Revert the affected deployment or Git commit.
4. Review GitHub audit/security alerts, Cloudflare Security Events, and D1 audit logs.
5. Restore database data from a verified backup if required.
6. Document the incident and corrective action.
