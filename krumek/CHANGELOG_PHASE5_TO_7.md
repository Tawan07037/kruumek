# Changelog — krumek Phase 5–7

## Phase 5: JavaScript modules
- Moved the device-type data into `assets/js/data/device-types.js`.
- Moved topology/device/link model creation into `assets/js/network/model.js`.
- Moved route/status calculations into `assets/js/network/routing.js`.
- Moved the old simulator and tightly coupled UI into `assets/js/core/legacy-app.js`.
- Moved the landing/recommendation behavior into `assets/js/ui/recommendations.js`.
- Added `assets/js/main.js` as the module entry point.
- Replaced two dynamically generated inline `onclick` attributes with `data-action` plus delegated event handling.
- Kept the public HTML structure and CSS content unchanged; only the script entry point now loads `main.js`.

## Phase 7: Backend and SQL
- Added Pages Functions for health, public announcements, admin identity, announcements CRUD/archive, and audit viewing.
- Added D1 migration for roles, announcements, and audit logs.
- Added manual Cloudflare Access JWT verification (signature/JWKS, issuer, audience, expiry, not-before).
- Added server-side role checks and same-origin checks for state-changing API requests.
- Added a separate `/admin/` interface; the public site design is untouched.
- Added `build.sh` and `_routes.json` generation for Pages Functions routing.

## Scope and limitations
- The existing network topology remains sample/simulation data in frontend modules because the page needs it to draw the public demo. The inspected source did not identify real credentials or explicit personal records. Confirm that sample IPs/device labels are not copied from a real private network before publishing.
- D1 tables are for role mapping, public announcements and audit. They do not yet model unknown personal-data fields that were not identified in the supplied source.
- Browser-delivered JavaScript is still inspectable by design; secrets must remain in server-side bindings/Secrets.
- Full browser QA against your live Cloudflare account remains to be completed by you on a Preview deployment.
