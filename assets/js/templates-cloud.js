import { api, supabase } from "./backend.js";
const root = document.querySelector(".content .panel");
const btn = document.querySelector("#actionBtn");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let templates = [];
function notify(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.querySelector("span").textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
}
function render() {
  if (!root) return;
  root.innerHTML = '<div class="module-head"><div><h2>Message templates</h2><p>Reusable message drafts saved to your authenticated cloud workspace.</p></div><span class="connection-state">Supabase cloud</span></div>' +
    '<div class="module-table-wrap"><table class="module-table"><thead><tr><th>TEMPLATE</th><th>LANGUAGE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>' +
    templates.map(t => '<tr><td><b>' + esc(t.name) + '</b><small>' + esc(t.body.slice(0, 76)) + '</small></td><td>' + esc(t.language || "en") + '</td><td><span class="consent-badge ' + (t.status === "approved" ? "yes" : "pending") + '">' + esc(t.status || "draft") + '</span></td><td><button class="row-menu" data-edit="' + t.id + '">Edit</button> <button class="row-menu" data-delete="' + t.id + '">Delete</button></td></tr>').join("") +
    '</tbody></table></div>' + (templates.length ? "" : '<div class="module-empty">No cloud templates yet. Create your first message draft.</div>') +
    '<p class="module-note">These are saved drafts only. WhatsApp template approval and delivery must be completed through Meta WhatsApp Manager and the official Cloud API.</p>';
}
function editor(item) {
  const wrap = document.createElement("div");
  wrap.className = "modal-backdrop open";
  wrap.innerHTML = '<section class="contact-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>' + (item ? "Edit template" : "New template") + '</h2><p>Save a reusable message draft.</p></div><button class="icon-btn" type="button" data-close aria-label="Close">×</button></div><form><label>Template name<input name="name" required maxlength="100" placeholder="Order update"></label><label>Message body<textarea name="body" required rows="4" maxlength="4000" placeholder="Hello {{1}}, your order is ready..."></textarea></label><label>Language code<input name="language" required maxlength="12" value="en" placeholder="en"></label><div class="form-error" role="alert"></div><div class="modal-actions"><button type="button" class="button button-outline" data-close>Cancel</button><button class="button button-primary">Save draft</button></div></form></section>';
  const form = wrap.querySelector("form");
  if (item) {
    form.elements.name.value = item.name || "";
    form.elements.body.value = item.body || "";
    form.elements.language.value = item.language || "en";
  }
  wrap.querySelector("[data-close]").onclick = () => wrap.remove();
  form.onsubmit = async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const error = form.querySelector(".form-error");
    const body = { name: values.name.trim(), body: values.body.trim(), language: values.language.trim(), status: item?.status || "draft" };
    if (!/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(body.language)) {
      error.textContent = "Use a language code such as en or en_US.";
      return;
    }
    try {
      if (item) await api("templates", { method: "PATCH", id: item.id, body });
      else await api("templates", { method: "POST", body });
      wrap.remove();
      await load();
      notify("Template saved to cloud");
    } catch (err) { error.textContent = err.message; }
  };
  document.body.append(wrap);
}
async function load() {
  templates = await api("templates");
  render();
  const stat = document.querySelector(".stat-value");
  if (stat) stat.textContent = String(templates.length).padStart(2, "0");
  const tag = document.querySelector(".stat-foot .neutral-tag");
  if (tag) tag.textContent = "Supabase records";
  const mode = document.querySelectorAll(".stat-value")[1];
  if (mode) mode.textContent = "Cloud workspace";
  const foot = document.querySelectorAll(".stat-foot")[1];
  if (foot) foot.textContent = "Authenticated cloud data";
}
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { location.replace("auth.html"); return; }
  if (btn) btn.onclick = () => editor(null);
  try { await load(); } catch (err) { notify(err.message); }
});
root?.addEventListener("click", async event => {
  const edit = event.target.closest("[data-edit]");
  const del = event.target.closest("[data-delete]");
  if (edit) editor(templates.find(t => t.id === edit.dataset.edit));
  if (del && confirm("Delete this template?")) {
    try {
      await api("templates", { method: "DELETE", id: del.dataset.delete });
      await load();
      notify("Template deleted");
    } catch (err) { notify(err.message); }
  }
});
