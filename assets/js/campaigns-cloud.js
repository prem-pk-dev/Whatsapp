import { api, supabase } from "./backend.js";
const root = document.querySelector(".content .panel");
const btn = document.querySelector("#actionBtn");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let rows = [];
function notify(s) { const t=document.querySelector("#toast"); if(t){t.querySelector("span").textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);} }
function render() {
 if(!root)return;
 root.innerHTML='<div class="module-head"><div><h2>Campaign workspace</h2><p>Campaign records saved to your cloud account.</p></div><span class="connection-state">Supabase cloud</span></div><div class="module-table-wrap"><table class="module-table"><thead><tr><th>CAMPAIGN</th><th>STATUS</th><th>SCHEDULE</th><th>ACTIONS</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+esc(x.name)+'</b><small>'+esc(x.body.slice(0,65))+'</small></td><td>'+esc(x.status)+'</td><td>'+esc(x.scheduled_at?new Date(x.scheduled_at).toLocaleString():"—")+'</td><td><button class="row-menu" data-edit="'+x.id+'">Edit</button> <button class="row-menu" data-delete="'+x.id+'">Delete</button></td></tr>').join("")+'</tbody></table></div>'+(rows.length?"":'<div class="module-empty">No cloud campaigns yet.</div>')+'<p class="module-note">Saving a campaign does not send WhatsApp messages. Sending requires approved Meta Cloud API setup and consent validation.</p>';
}
function editor(item) {
 const wrap=document.createElement("div");wrap.className="modal-backdrop open";
 wrap.innerHTML='<section class="contact-modal"><div class="modal-head"><div><h2>'+(item?"Edit campaign":"New campaign")+'</h2></div><button data-close type="button">×</button></div><form><label>Name<input name="name" required maxlength="100"></label><label>Message<textarea name="body" required rows="4" maxlength="4000"></textarea></label><label>Schedule (optional)<input name="scheduled_at" type="datetime-local"></label><div class="form-error"></div><div class="modal-actions"><button type="button" class="button button-outline" data-close>Cancel</button><button class="button button-primary">Save</button></div></form></section>';
 const f=wrap.querySelector("form");if(item){f.elements.name.value=item.name;f.elements.body.value=item.body;f.elements.scheduled_at.value=item.scheduled_at?new Date(item.scheduled_at).toISOString().slice(0,16):"";}
 wrap.querySelector("[data-close]").onclick=()=>wrap.remove();
 f.onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(f));const err=f.querySelector(".form-error");if(v.scheduled_at&&new Date(v.scheduled_at)<=new Date()){err.textContent="Choose a future date and time.";return;}const body={name:v.name.trim(),body:v.body.trim(),status:v.scheduled_at?"scheduled":"draft",scheduled_at:v.scheduled_at?new Date(v.scheduled_at).toISOString():null};try{if(item)await api("campaigns",{method:"PATCH",id:item.id,body});else await api("campaigns",{method:"POST",body});wrap.remove();await load();notify("Cloud campaign saved");}catch(x){err.textContent=x.message;}};
 document.body.append(wrap);
}
async function load(){rows=await api("campaigns");render();const stats=document.querySelectorAll(".stat-value");if(stats[0])stats[0].textContent=String(rows.length).padStart(2,"0");if(stats[1])stats[1].textContent="Cloud workspace";const tags=document.querySelectorAll(".stat-foot");if(tags[0])tags[0].textContent="Supabase records";if(tags[1])tags[1].textContent="Authenticated cloud data";}
document.addEventListener("DOMContentLoaded",async()=>{const {data:{session}}=await supabase.auth.getSession();if(!session){location.replace("auth.html");return;}if(btn)btn.onclick=()=>editor(null);try{await load();}catch(e){notify(e.message);}});
root?.addEventListener("click",async e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit){editor(rows.find(x=>x.id===edit.dataset.edit));}if(del&&confirm("Delete this campaign?")){try{await api("campaigns",{method:"DELETE",id:del.dataset.delete});await load();notify("Campaign deleted");}catch(x){notify(x.message);}}});
