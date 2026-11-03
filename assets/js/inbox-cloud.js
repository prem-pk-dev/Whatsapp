import { api, supabase } from "./backend.js";
const root = document.querySelector(".content .panel");
const action = document.querySelector("#actionBtn");
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let conversations = [], messages = [], contacts = [], activeId = null;
function toast(message) {
  const node = document.querySelector("#toast");
  if (!node) return;
  node.querySelector("span").textContent = message;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 2400);
}
function contactName(phone) {
  return contacts.find(contact => contact.phone === phone)?.name || phone;
}
function latestMessage(conversationId) {
  return messages.filter(message => message.conversation_id === conversationId)
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
}
function render() {
  if (!root) return;
  const sorted = [...conversations].sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
  root.innerHTML = '<div class="module-head"><div><h2>Cloud conversations</h2><p>Conversation records and message drafts in your account.</p></div><span class="connection-state">Supabase cloud</span></div>' +
    '<div class="module-table-wrap"><table class="module-table"><thead><tr><th>CONTACT</th><th>LATEST MESSAGE / DRAFT</th><th>UPDATED</th><th>ACTIONS</th></tr></thead><tbody>' +
    sorted.map(conversation => {
      const latest = latestMessage(conversation.id);
      return '<tr><td><b>' + esc(contactName(conversation.phone)) + '</b><small>' + esc(conversation.phone) + '</small></td><td>' + esc(latest?.body || "No messages yet") + (latest ? '<small>' + esc(latest.status) + '</small>' : '') + '</td><td>' + esc(new Date(conversation.updated_at).toLocaleString()) + '</td><td><button class="row-menu" data-open="' + conversation.id + '">Open</button> <button class="row-menu" data-delete="' + conversation.id + '">Delete</button></td></tr>';
    }).join("") +
    '</tbody></table></div>' + (sorted.length ? "" : '<div class="module-empty">No conversations yet. Start one to create a cloud conversation.</div>') +
    '<div id="conversation-detail" class="module-note" style="margin-top:18px">Select a conversation to view messages and save a draft.</div>' +
    '<p class="module-note">Messages saved here are drafts/records only. The Open WhatsApp action hands off to WhatsApp for you to review and send manually. No message is sent automatically.</p>';
  const stats = document.querySelectorAll(".stat-value");
  if (stats[0]) stats[0].textContent = String(conversations.length).padStart(2,"0");
  if (stats[1]) stats[1].textContent = "Cloud workspace";
  const foot = document.querySelector(".stat-foot .neutral-tag");
  if (foot) foot.textContent = "Supabase records";
  const foot2 = document.querySelectorAll(".stat-foot")[1];
  if (foot2) foot2.textContent = "Manual WhatsApp handoff";
}
function showConversation(id) {
  activeId = id;
  const conversation = conversations.find(item => item.id === id);
  const detail = document.querySelector("#conversation-detail");
  if (!conversation || !detail) return;
  const thread = messages.filter(message => message.conversation_id === id).sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
  detail.innerHTML = '<b>' + esc(contactName(conversation.phone)) + ' · ' + esc(conversation.phone) + '</b>' +
    '<div class="module-table-wrap" style="margin-top:12px"><table class="module-table"><thead><tr><th>DIRECTION</th><th>MESSAGE</th><th>STATUS</th><th>TIME</th></tr></thead><tbody>' +
    thread.map(message => '<tr><td>' + esc(message.direction) + '</td><td>' + esc(message.body) + '</td><td>' + esc(message.status) + '</td><td>' + esc(new Date(message.created_at).toLocaleString()) + '</td></tr>').join("") +
    '</tbody></table></div>' + (thread.length ? "" : '<p>No messages recorded yet.</p>') +
    '<form id="draft-form" style="display:grid;gap:10px;margin-top:14px"><label>Message draft<textarea name="body" rows="3" maxlength="4000" required placeholder="Write a message to review..."></textarea></label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="button button-primary">Save draft</button><button type="button" class="button button-outline" id="manual-send">Open WhatsApp</button></div><div class="form-error" role="alert"></div></form>';
  detail.querySelector("#draft-form").onsubmit = async event => {
    event.preventDefault();
    const body = new FormData(event.currentTarget).get("body").trim();
    const error = event.currentTarget.querySelector(".form-error");
    if (!body) return;
    try {
      await api("messages", {method:"POST",body:{conversation_id:id,direction:"outbound",body,status:"draft"}});
      await load();
      showConversation(id);
      toast("Message draft saved to cloud");
    } catch (err) { error.textContent = err.message; }
  };
  detail.querySelector("#manual-send").onclick = () => {
    const phone = conversation.phone.replace(/[^0-9]/g,"");
    const draft = detail.querySelector('textarea[name="body"]').value.trim();
    if (!phone) return toast("Add a phone number with country code.");
    window.open("https://wa.me/" + phone + (draft ? "?text=" + encodeURIComponent(draft) : ""), "_blank", "noopener");
  };
}
function createConversation() {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop open";
  modal.innerHTML = '<section class="contact-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>Start a conversation</h2><p>Use a saved contact or enter a phone number.</p></div><button class="icon-btn" type="button" data-close aria-label="Close">×</button></div><form><label>Contact<select name="contact_id"><option value="">Enter phone manually</option>' +
    contacts.map(contact => '<option value="' + esc(contact.id) + '">' + esc(contact.name) + ' · ' + esc(contact.phone) + '</option>').join("") +
    '</select></label><label>Phone number<input name="phone" required placeholder="+919876543210"></label><div class="form-error" role="alert"></div><div class="modal-actions"><button type="button" class="button button-outline" data-close>Cancel</button><button class="button button-primary">Create conversation</button></div></form></section>';
  const form = modal.querySelector("form");
  const select = form.elements.contact_id;
  select.onchange = () => {
    const selected = contacts.find(contact => contact.id === select.value);
    if (selected) form.elements.phone.value = selected.phone;
  };
  modal.querySelector("[data-close]").onclick = () => modal.remove();
  form.onsubmit = async event => {
    event.preventDefault();
    const phone = form.elements.phone.value.trim();
    const contactId = form.elements.contact_id.value;
    const error = form.querySelector(".form-error");
    if (!/^\+?[0-9][0-9 ()-]{5,18}$/.test(phone)) {
      error.textContent = "Enter a valid phone number with country code.";
      return;
    }
    if (conversations.some(item => item.phone === phone)) {
      error.textContent = "A conversation for this phone number already exists.";
      return;
    }
    try {
      const result = await api("conversations", {method:"POST",body:{phone,contact_id:contactId || null,updated_at:new Date().toISOString()}});
      modal.remove();
      await load();
      const created = Array.isArray(result) ? result[0] : result;
      const id = created?.id || conversations.find(item => item.phone === phone)?.id;
      if (id) showConversation(id);
      toast("Cloud conversation created");
    } catch (err) { error.textContent = err.message; }
  };
  document.body.append(modal);
}
async function load() {
  [conversations,messages,contacts] = await Promise.all([api("conversations"),api("messages"),api("contacts")]);
  render();
}
document.addEventListener("DOMContentLoaded", async () => {
  const {data:{session}} = await supabase.auth.getSession();
  if (!session) { location.replace("auth.html"); return; }
  if (action) action.onclick = createConversation;
  try { await load(); } catch (err) { toast(err.message); }
});
root?.addEventListener("click", async event => {
  const open = event.target.closest("[data-open]");
  const del = event.target.closest("[data-delete]");
  if (open) showConversation(open.dataset.open);
  if (del && confirm("Delete this conversation and its message records?")) {
    try {
      await api("conversations", {method:"DELETE",id:del.dataset.delete});
      if (activeId === del.dataset.delete) activeId = null;
      await load();
      toast("Conversation deleted");
    } catch (err) { toast(err.message); }
  }
});
