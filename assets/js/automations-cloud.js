import { api, supabase } from "./backend.js";
const root = document.querySelector(".content .panel");
const action = document.querySelector("#actionBtn");
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let rules = [];
function toast(message) {
  const node = document.querySelector("#toast");
  if (!node) return;
  node.querySelector("span").textContent = message;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 2400);
}
function render() {
  if (!root) return;
  root.innerHTML = '<div class="module-head"><div><h2>Automation rules</h2><p>Rules stored in your authenticated cloud workspace.</p></div><span class="connection-state">Supabase cloud</span></div>' +
    '<div class="module-table-wrap"><table class="module-table"><thead><tr><th>RULE</th><th>TRIGGER KEYWORD</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>' +
    rules.map(rule => '<tr><td><b>' + escapeHtml(rule.name) + '</b><small>' + escapeHtml(rule.reply_text.slice(0, 72)) + '</small></td><td>' + escapeHtml(rule.trigger_keyword) + '</td><td><span class="consent-badge ' + (rule.enabled ? "yes" : "pending") + '">' + (rule.enabled ? "Enabled" : "Paused") + '</span></td><td><button class="row-menu" data-toggle="' + rule.id + '">' + (rule.enabled ? "Pause" : "Enable") + '</button> <button class="row-menu" data-edit="' + rule.id + '">Edit</button> <button class="row-menu" data-delete="' + rule.id + '">Delete</button></td></tr>').join("") +
    '</tbody></table></div>' + (rules.length ? "" : '<div class="module-empty">No cloud automation rules yet. Create your first rule.</div>') +
    '<p class="module-note">Rules are saved only. They do not send automatic WhatsApp replies until a verified webhook, secure backend execution and official Meta Cloud API setup are configured. Use them only for opted-in contacts and within WhatsApp policy.</p>';
  const stat = document.querySelector(".stat-value");
  if (stat) stat.textContent = String(rules.filter(rule => rule.enabled).length).padStart(2, "0");
  const foot = document.querySelector(".stat-foot .neutral-tag");
  if (foot) foot.textContent = "Supabase records";
  const mode = document.querySelectorAll(".stat-value")[1];
  if (mode) mode.textContent = "Cloud workspace";
  const modeFoot = document.querySelectorAll(".stat-foot")[1];
  if (modeFoot) modeFoot.textContent = "Rules saved; replies inactive";
}
function editor(item = null) {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop open";
  modal.innerHTML = '<section class="contact-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>' + (item ? "Edit automation" : "Create automation") + '</h2><p>Configure a keyword and suggested reply.</p></div><button class="icon-btn" type="button" data-close aria-label="Close">×</button></div><form><label>Rule name<input name="name" required maxlength="100" placeholder="Greeting reply"></label><label>Trigger keyword<input name="trigger_keyword" required maxlength="80" placeholder="hello"></label><label>Reply text<textarea name="reply_text" rows="4" required maxlength="2000" placeholder="Hi! How can we help?"></textarea></label><div class="form-error" role="alert"></div><div class="modal-actions"><button type="button" class="button button-outline" data-close>Cancel</button><button class="button button-primary">Save rule</button></div></form></section>';
  const form = modal.querySelector("form");
  if (item) {
    form.elements.name.value = item.name || "";
    form.elements.trigger_keyword.value = item.trigger_keyword || "";
    form.elements.reply_text.value = item.reply_text || "";
  }
  modal.querySelector("[data-close]").onclick = () => modal.remove();
  form.onsubmit = async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const error = form.querySelector(".form-error");
    const body = { name: values.name.trim(), trigger_keyword: values.trigger_keyword.trim(), reply_text: values.reply_text.trim(), enabled: item ? Boolean(item.enabled) : false };
    if (!body.name || !body.trigger_keyword || !body.reply_text) {
      error.textContent = "Complete all fields before saving.";
      return;
    }
    try {
      if (item) await api("automation_rules", { method: "PATCH", id: item.id, body });
      else await api("automation_rules", { method: "POST", body });
      modal.remove();
      await load();
      toast("Automation rule saved to cloud");
    } catch (err) { error.textContent = err.message; }
  };
  document.body.append(modal);
}
async function load() {
  rules = await api("automation_rules");
  render();
}
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { location.replace("auth.html"); return; }
  if (action) action.onclick = () => editor();
  try { await load(); } catch (err) { toast(err.message); }
});
root?.addEventListener("click", async event => {
  const toggle = event.target.closest("[data-toggle]");
  const edit = event.target.closest("[data-edit]");
  const del = event.target.closest("[data-delete]");
  if (toggle) {
    const rule = rules.find(item => item.id === toggle.dataset.toggle);
    if (!rule) return;
    try {
      await api("automation_rules", { method: "PATCH", id: rule.id, body: { enabled: !rule.enabled } });
      await load();
      toast(rule.enabled ? "Rule paused" : "Rule enabled");
    } catch (err) { toast(err.message); }
  }
  if (edit) {
    const rule = rules.find(item => item.id === edit.dataset.edit);
    if (rule) editor(rule);
  }
  if (del && confirm("Delete this automation rule?")) {
    try {
      await api("automation_rules", { method: "DELETE", id: del.dataset.delete });
      await load();
      toast("Automation rule deleted");
    } catch (err) { toast(err.message); }
  }
});
