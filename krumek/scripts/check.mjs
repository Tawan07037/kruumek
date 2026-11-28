import { readFile, access } from "node:fs/promises";

const required = [
  "index.html",
  "admin/index.html",
  "assets/js/admin/main.js",
  "assets/css/admin.css",
  "assets/css/styles.css",
  "assets/js/main.js",
  "assets/js/data/device-types.js",
  "assets/js/network/model.js",
  "assets/js/network/routing.js",
  "assets/js/core/legacy-app.js",
  "assets/js/ui/recommendations.js",
  "assets/js/services/api.js",
  "_headers",
  "functions/_middleware.js",
  "functions/api/health.js",
  "functions/api/public/announcements.js",
  "functions/api/admin/whoami.js",
  "functions/api/admin/announcements.js",
  "functions/api/admin/audit.js",
  "functions/_lib/access.js",
  "migrations/0001_initial.sql"
];

for (const file of required) await access(new URL("../" + file, import.meta.url));
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
if (!html.includes('type="module" src="./assets/js/main.js"')) {
  throw new Error("index.html is not loading the module entry point");
}
console.log("Required project files are present.");
