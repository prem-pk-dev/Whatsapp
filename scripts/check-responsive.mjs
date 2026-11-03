import { readFileSync } from "node:fs";

const pages = [
  "index.html",
  "contacts.html",
  "campaigns.html",
  "inbox.html",
  "groups.html",
  "automations.html",
  "templates.html",
  "analytics.html",
  "settings.html",
];
const css = readFileSync("assets/css/style.css", "utf8");
const app = readFileSync("assets/js/app.js", "utf8");
const failures = [];

for (const page of pages) {
  const html = readFileSync(page, "utf8");
  if (!/name="viewport"/i.test(html)) failures.push(`${page}: missing viewport meta`);
  if (!/id="sidebar"/.test(html)) failures.push(`${page}: missing sidebar hook`);
  if (!/id="menuBtn"/.test(html)) failures.push(`${page}: missing mobile menu button`);
  if (!/assets\/js\/app\.js/.test(html)) failures.push(`${page}: missing shared navigation script`);
}

for (const rule of [
  "overflow-x:hidden",
  "@media(max-width:850px)",
  "@media(max-width:560px)",
  "min-width:320px",
]) {
  if (!css.includes(rule)) failures.push(`style.css: missing responsive safeguard ${rule}`);
}
if (!app.includes("Escape") || !app.includes("aria-expanded")) {
  failures.push("app.js: missing accessible Escape/expanded-state handling");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Responsive smoke check passed for ${pages.length} workspace pages.`);
