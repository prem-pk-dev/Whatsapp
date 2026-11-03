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
  '<div class="settings-divider"></div><div class="settings-section"><h3>WhatsApp Business connection</h3><p>Not connected. Official Cloud API setup requires a Meta Business account, a WhatsApp Business phone number, and server-side credentials. No access token is requested or stored on this page.</p><span class="connection-state">Setup pending</span></div>' +
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
  if (connectButton) connectButton.addEventListener("click", () => notice("Meta WhatsApp Cloud API setup is not configured yet."));
});
