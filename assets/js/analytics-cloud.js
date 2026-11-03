import { supabase } from "./backend.js";
const panel = document.querySelector(".content .panel");
const button = document.querySelector("#actionBtn");
const modules = [
  ["contacts","Contacts","created_at"],
  ["campaigns","Campaigns","created_at"],
  ["conversations","Conversations","updated_at"],
  ["messages","Messages","created_at"],
  ["templates","Templates","created_at"],
  ["automation_rules","Automation rules","created_at"],
  ["group_plans","Group plans","created_at"]
];
let report = [];
const safe = value => String(value).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.querySelector("span").textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}
async function getCount(table, dateColumn, since) {
  let request = supabase.from(table).select("id", {count:"exact",head:true});
  if (since) request = request.gte(dateColumn, since);
  const {count,error} = await request;
  if (error) throw new Error(table + ": " + error.message);
  return count || 0;
}
async function loadReport() {
  const since = new Date(Date.now()-30*86400000).toISOString();
  report = await Promise.all(modules.map(async ([table,label,column]) => ({
    label,
    total: await getCount(table,column,null),
    recent: await getCount(table,column,since)
  })));
  const contacts = report.find(x=>x.label==="Contacts").total;
  const messages = report.find(x=>x.label==="Messages");
  document.querySelector(".stats-grid").innerHTML =
    '<article class="stat-card"><div class="stat-top"><span>Total contacts</span></div><div class="stat-value">'+contacts+'</div><div class="stat-foot">Cloud records</div></article>' +
    '<article class="stat-card"><div class="stat-top"><span>Total messages</span></div><div class="stat-value">'+messages.total+'</div><div class="stat-foot">Stored message records</div></article>';
  panel.innerHTML = '<div class="panel-heading"><div><h2>Workspace analytics</h2><p>Supabase records · all time and last 30 days</p></div><span class="connection-state">Live database</span></div>' +
    '<div class="module-table-wrap"><table class="module-table"><thead><tr><th>MODULE</th><th>ALL TIME</th><th>LAST 30 DAYS</th></tr></thead><tbody>' +
    report.map(x=>'<tr><td><b>'+x.label+'</b></td><td>'+x.total+'</td><td>'+x.recent+'</td></tr>').join("") +
    '</tbody></table></div><p class="module-note">Counts are scoped to your signed-in account by Supabase RLS. They measure saved records, not WhatsApp delivery, read receipts, clicks, or conversions. Those metrics require verified Meta webhook events.</p>';
}
function exportReport() {
  if (!report.length) return showToast("Report is still loading.");
  const csv = [["Module","All time","Last 30 days"],...report.map(x=>[x.label,x.total,x.recent])]
    .map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = "wa-studio-analytics.csv"; anchor.click();
  URL.revokeObjectURL(url);
}
document.addEventListener("DOMContentLoaded",async()=>{
  const {data:{session}} = await supabase.auth.getSession();
  if (!session) { location.replace("auth.html"); return; }
  button?.addEventListener("click",exportReport);
  try { await loadReport(); }
  catch(error) {
    panel.innerHTML = '<div class="panel-heading"><div><h2>Analytics unavailable</h2><p>'+safe(error.message)+'</p></div><span class="connection-state">Needs attention</span></div>';
    showToast("Cloud analytics could not load.");
  }
});
