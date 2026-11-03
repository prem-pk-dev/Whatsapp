import { api, supabase } from "./backend.js";
const root = document.querySelector(".content .panel");
const action = document.querySelector("#actionBtn");
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let plans = [];
function toast(message) {
  const node = document.querySelector("#toast");
  if (!node) return;
  node.querySelector("span").textContent = message;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 2400);
}
function render() {
  if (!root) return;
  root.innerHTML = '<div class="module-head"><div><h2>Group plans & invitation links</h2><p>Save group details and invitation URLs you already own.</p></div><span class="connection-state">Supabase cloud</span></div>' +
    '<div class="module-table-wrap"><table class="module-table"><thead><tr><th>GROUP / PLAN</th><th>INVITATION URL</th><th>CREATED</th><th>ACTIONS</th></tr></thead><tbody>' +
    plans.map(plan => '<tr><td><b>' + esc(plan.name) + '</b><small>Saved group plan</small></td><td>' + (plan.invite_url ? '<a href="' + esc(plan.invite_url) + '" target="_blank" rel="noopener noreferrer">Open invite</a>' : '<span class="consent-badge pending">No link saved</span>') + '</td><td>' + esc(new Date(plan.created_at).toLocaleDateString()) + '</td><td><button class="row-menu" data-edit="' + plan.id + '">Edit</button> ' + (plan.invite_url ? '<button class="row-menu" data-copy="' + plan.id + '">Copy link</button> ' : '') + '<button class="row-menu" data-delete="' + plan.id + '">Delete</button></td></tr>').join("") +
    '</tbody></table></div>' + (plans.length ? "" : '<div class="module-empty">No group plans saved yet. Create your first group plan.</div>') +
    '<p class="module-note">This stores group plans and existing invite URLs only. It does not create WhatsApp groups, generate official invite links, add members, or send invitations. Create/manage the group in WhatsApp and paste its invite URL here.</p>';
  const stat = document.querySelector(".stat-value");
  if (stat) stat.textContent = String(plans.length).padStart(2,"0");
  const foot = document.querySelector(".stat-foot .neutral-tag");
  if (foot) foot.textContent = "Supabase records";
  const mode = document.querySelectorAll(".stat-value")[1];
  if (mode) mode.textContent = "Cloud workspace";
  const foot2 = document.querySelectorAll(".stat-foot")[1];
  if (foot2) foot2.textContent = "External invite links only";
}
function editor(item = null) {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop open";
  modal.innerHTML = '<section class="contact-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>' + (item ? "Edit group plan" : "Create group plan") + '</h2><p>Save a group name and an existing invitation URL.</p></div><button class="icon-btn" type="button" data-close aria-label="Close">×</button></div><form><label>Group name<input name="name" required maxlength="120" placeholder="Customer support community"></label><label>Existing invite URL (optional)<input name="invite_url" type="url" maxlength="2000" placeholder="https://chat.whatsapp.com/..."></label><div class="form-error" role="alert"></div><div class="modal-actions"><button type="button" class="button button-outline" data-close>Cancel</button><button class="button button-primary">Save group plan</button></div></form></section>';
  const form = modal.querySelector("form");
  if (item) {
    form.elements.name.value = item.name || "";
    form.elements.invite_url.value = item.invite_url || "";
  }
  modal.querySelector("[data-close]").onclick = () => modal.remove();
  form.onsubmit = async event => {
    event.preventDefault();
    const error = form.querySelector(".form-error");
    const name = form.elements.name.value.trim();
    const invite = form.elements.invite_url.value.trim();
    if (invite) {
      try {
        const parsed = new URL(invite);
        if (parsed.protocol !== "https:") throw new Error("Use a secure HTTPS invitation URL.");
        if (!["chat.whatsapp.com","www.chat.whatsapp.com"].includes(parsed.hostname)) throw new Error("Enter a WhatsApp group invite URL.");
      } catch (err) { error.textContent = err.message || "Enter a valid invitation URL."; return; }
    }
    try {
      const body = {name,invite_url:invite || null};
      if (item) await api("group_plans",{method:"PATCH",id:item.id,body});
      else await api("group_plans",{method:"POST",body});
      modal.remove();
      await load();
      toast("Group plan saved to cloud");
    } catch (err) { error.textContent = err.message; }
  };
  document.body.append(modal);
}
async function load() {
  plans = await api("group_plans");
  render();
}
document.addEventListener("DOMContentLoaded", async () => {
  const {data:{session}} = await supabase.auth.getSession();
  if (!session) { location.replace("auth.html"); return; }
  if (action) action.onclick = () => editor();
  try { await load(); } catch (err) { toast(err.message); }
});
root?.addEventListener("click", async event => {
  const edit = event.target.closest("[data-edit]");
  const del = event.target.closest("[data-delete]");
  const copy = event.target.closest("[data-copy]");
  if (edit) {
    const item = plans.find(plan => plan.id === edit.dataset.edit);
    if (item) editor(item);
  }
  if (copy) {
    const item = plans.find(plan => plan.id === copy.dataset.copy);
    if (item?.invite_url && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(item.invite_url).then(() => toast("Invitation URL copied")).catch(() => toast("Clipboard access unavailable"));
    } else if (item?.invite_url) toast(item.invite_url);
  }
  if (del && confirm("Delete this group plan?")) {
    try {
      await api("group_plans",{method:"DELETE",id:del.dataset.delete});
      await load();
      toast("Group plan deleted");
    } catch (err) { toast(err.message); }
  }
});
