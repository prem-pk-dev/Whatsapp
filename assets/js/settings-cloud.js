import { supabase } from "./backend.js";
const panel = document.querySelector(".content .panel");
const connectButton = document.querySelector("#actionBtn");
let currentUser;
let saved = { display_name: "", timezone: "Asia/Kolkata" };
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function notice(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.querySelector("span").textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}
function render() {
  if (!panel) return;
  panel.innerHTML = '<div class="panel-heading"><div><h2>Workspace preferences</h2><p>These preferences are saved to your private Supabase account.</p></div><span class="connection-state">Cloud synced</span></div>' +
  '<form id="settingsForm" class="settings-form"><div class="settings-field"><label for="displayName">Workspace display name</label><input id="displayName" name="display_name" maxlength="80" required value="' + esc(saved.display_name) + '" placeholder="Prem PK"></div>' +
  '<div class="settings-field"><label for="timezone">Timezone</label><select id="timezone" name="timezone"><option value="Asia/Kolkata">India — Asia/Kolkata (IST)</option><option value="UTC">UTC</option><option value="Asia/Dubai">Asia/Dubai</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option><option value="Asia/Singapore">Asia/Singapore</option></select></div>' +
  '<div class="settings-actions"><button class="button button-primary" type="submit">Save preferences</button><span id="saveState" role="status">Changes are private to your signed-in account.</span></div></form>' +
  '<div class="settings-divider"></div><div class="settings-section"><h3>Connect your WhatsApp number</h3><p><b>Currently using Personal WhatsApp Messenger?</b> The official Cloud API cannot connect that account directly while it remains a personal Messenger account.</p><p><b>Same-number route:</b> back up your chats, then use WhatsApp’s official switch-to-WhatsApp-Business-App process for the same number. After the number is active in WhatsApp Business App, Meta may allow Coexistence onboarding for eligible accounts. Eligibility is decided by Meta and is not guaranteed.</p><p><b>What WA Studio can then do:</b> after we implement Meta Embedded Signup, Cloud API credentials and verified webhooks, supported 1:1 business conversations can appear here and automation/replies can be added. Personal groups, calls and Status will not become a full mirror in WA Studio.</p><p><b>Important:</b> do not uninstall or delete your current account before backing up and reviewing WhatsApp’s official transfer instructions. Do not share your SMS/OTP or scan a QR code from an unofficial automation tool.</p><div class="settings-actions"><a class="button button-outline" href="https://faq.whatsapp.com/" target="_blank" rel="noopener noreferrer">WhatsApp Help Center</a><a class="button button-outline" href="https://developers.facebook.com/docs/whatsapp/embedded-signup/" target="_blank" rel="noopener noreferrer">Meta setup guide</a><a class="button button-outline" href="https://developers.facebook.com/docs/whatsapp/cloud-api/" target="_blank" rel="noopener noreferrer">Cloud API docs</a></div><span class="connection-state">Not connected · setup pending</span></div>' +
  '<div class="settings-section"><h3>Security</h3><p>Workspace preferences are accessed with your signed-in Supabase session and protected by owner-level Row Level Security.</p></div>';
  const select = panel.querySelector("#timezone");
  select.value = saved.timezone || "Asia/Kolkata";
  panel.querySelector("#settingsForm").addEventListener("submit", save);
}
async function save(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const state = panel.querySelector("#saveState");
  const display_name = form.elements.display_name.value.trim();
  const timezone = form.elements.timezone.value;
  if (!display_name) { state.textContent = "Enter a workspace name."; return; }
  state.textContent = "Saving…";
  const { error } = await supabase.from("settings").upsert({
    user_id: currentUser.id,
    display_name,
    timezone,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
  if (error) { state.textContent = error.message; return; }
  saved = { display_name, timezone };
  state.textContent = "Saved securely to Supabase.";
  const workspaceName = document.querySelector(".workspace b");
  if (workspaceName) workspaceName.textContent = display_name;
  notice("Workspace preferences saved");
}
document.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) lucide.createIcons();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { location.replace("auth.html"); return; }
  currentUser = session.user;
  const { data, error } = await supabase.from("settings").select("display_name,timezone").eq("user_id", currentUser.id).maybeSingle();
  if (error) { notice("Could not load preferences: " + error.message); return; }
  if (data) saved = data;
  else saved.display_name = currentUser.user_metadata?.display_name || currentUser.email?.split("@")[0] || "Prem PK";
  render();
  if (connectButton) connectButton.addEventListener("click", () => notice("Official Meta connection is not configured yet. Review the setup guide below."));
});
