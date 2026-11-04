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
const settings = readFileSync("assets/js/settings-cloud.js", "utf8");
const contacts = readFileSync("assets/js/contacts-cloud.js", "utf8");
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
if (!app.includes("modal-backdrop.open") || !app.includes("MutationObserver")) {
  failures.push("app.js: missing shared modal dismissal/focus initialization");
}
if (!app.includes("event.key==='Tab'") || !app.includes("last.focus()")) {
  failures.push("app.js: missing modal keyboard focus trap");
}

let braceDepth = 0;
for (const character of css) {
  if (character === "{") braceDepth++;
  if (character === "}") braceDepth--;
  if (braceDepth < 0) break;
}
if (braceDepth !== 0) failures.push("style.css: unbalanced CSS braces");
if (!css.includes("min-height:40px")) failures.push("style.css: missing mobile touch target sizing");
if (!css.includes("white-space:normal;max-width:calc(100% - 45px)")) {
  failures.push("style.css: missing narrow-screen notice wrapping");
}
if (!css.includes(":focus-visible")) failures.push("style.css: missing visible keyboard focus styles");
if (!css.includes("box-sizing:border-box")) failures.push("style.css: missing consistent box sizing");
if (!css.includes("minmax(0,1fr)")) failures.push("style.css: missing overflow-safe grid columns");
if (!css.includes("@media(max-width:360px)")) failures.push("style.css: missing very-narrow phone layout");
if (!css.includes("font-size:16px")) failures.push("style.css: missing mobile form font sizing to prevent browser zoom");
if (!css.includes("overscroll-behavior-x:contain") || !css.includes("-webkit-overflow-scrolling:touch")) failures.push("style.css: missing touch-friendly horizontal table scrolling");
if (!css.includes("min-height:36px") || !css.includes(".module-panel .row-menu")) failures.push("style.css: missing usable table row action targets");
if (!css.includes("overflow-wrap:anywhere")) failures.push("style.css: missing long-content wrapping safeguard");
if (!settings.includes("WhatsApp Business App") || !settings.includes("Personal WhatsApp Messenger")) failures.push("settings-cloud.js: missing clear account-type connection guidance");
if (!settings.includes("Same-number route")) failures.push("settings-cloud.js: missing same-number migration guidance");
if (!contacts.includes("function visibleRows()") || !contacts.includes('visibleRows().forEach(r=>e.target.checked?selected.add(r.id):selected.delete(r.id))')) failures.push("contacts-cloud.js: select-all must only affect currently filtered/visible contacts");
if (!settings.includes("Do not share your SMS/OTP")) failures.push("settings-cloud.js: missing OTP safety warning");
if (!settings.includes("developers.facebook.com/docs/whatsapp/embedded-signup/")) failures.push("settings-cloud.js: missing official Embedded Signup documentation link");
if (!settings.includes("developers.facebook.com/docs/whatsapp/cloud-api/")) failures.push("settings-cloud.js: missing official Cloud API documentation link");
if (!css.includes(".settings-actions") || !css.includes("@media(max-width:560px)")) failures.push("style.css: missing responsive settings action layout");
if (!css.includes(".topbar{\n  position:fixed;") || !css.includes(".main{padding-top:70px}") || !css.includes(".main{padding-top:60px}")) failures.push("style.css: header must remain fixed above scrolling content on desktop and mobile");


const auth = readFileSync("assets/js/auth.js", "utf8");
const authPage = readFileSync("auth.html", "utf8");
if (!auth.includes('supabase.auth.verifyOtp({email:pendingEmail||email,token,type:"signup"})')) failures.push("auth.js: signup must verify the email OTP");
if (!auth.includes('supabase.auth.resend({type:"signup",email:pendingEmail})')) failures.push("auth.js: signup must support OTP resend");
if (!authPage.includes('autocomplete="one-time-code"') || !authPage.includes('maxlength="6"')) failures.push("auth.html: missing accessible six-digit OTP input");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Responsive smoke check passed for ${pages.length} workspace pages.`);
