import { supabase } from "./backend.js";
const css=document.createElement("style");
css.textContent=".profile,.top-avatar{cursor:pointer}.profile:focus-visible,.top-avatar:focus-visible{outline:3px solid #168653;outline-offset:3px}.account-backdrop{position:fixed;inset:0;z-index:50;background:#10251c80;display:grid;place-items:center;padding:18px}.account-card{width:min(100%,390px);background:#fff;border:1px solid #e5ece7;border-radius:20px;padding:22px;box-shadow:0 24px 70px #10251c40}.account-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.account-head h2{font:700 18px Manrope,sans-serif;margin:0}.account-close{border:0;background:#f3f6f3;border-radius:9px;width:36px;height:36px;font-size:20px}.account-identity{display:flex;align-items:center;gap:12px;padding:14px;background:#f3f8f4;border-radius:13px;margin-bottom:16px;min-width:0}.account-avatar{width:44px;height:44px;flex:none;border-radius:14px;background:#dff1e6;color:#137548;display:grid;place-items:center;font-weight:800}.account-identity strong{display:block;font-size:13px}.account-identity small{display:block;margin-top:4px;color:#718078;font-size:11px;overflow-wrap:anywhere}.account-meta,.account-status{font-size:11px;color:#718078;line-height:1.6;overflow-wrap:anywhere}.account-signout{width:100%;border:0;border-radius:11px;padding:12px;background:#fff0ef;color:#b33f3a;font-weight:700}.account-status{min-height:18px;color:#b33f3a;margin-top:10px}body.account-open{overflow:hidden}";
document.head.append(css);
const initials=n=>(n||"PK").trim().split(/\\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
async function openAccount(){
 if(document.querySelector(".account-backdrop"))return;
 const back=document.createElement("div");back.className="account-backdrop";
 back.innerHTML='<section class="account-card" role="dialog" aria-modal="true" aria-labelledby="accountTitle"><div class="account-head"><h2 id="accountTitle">Your account</h2><button class="account-close" type="button" aria-label="Close">×</button></div><div class="account-identity"><div class="account-avatar">PK</div><div><strong>WA Studio account</strong><small>Loading account details…</small></div></div><p class="account-meta">Manage your signed-in account and securely end your session on this device.</p><button class="account-signout" type="button">Sign out</button><div class="account-status" role="status" aria-live="polite"></div></section>';
 document.body.append(back);document.body.classList.add("account-open");
 const close=()=>{back.remove();document.body.classList.remove("account-open")};
 back.querySelector(".account-close").addEventListener("click",close);
 back.addEventListener("click",e=>{if(e.target===back)close()});
 const esc=e=>{if(e.key==="Escape"&&back.isConnected){close();document.removeEventListener("keydown",esc)}};
 document.addEventListener("keydown",esc);
 const {data:{user},error}=await supabase.auth.getUser();
 if(error){back.querySelector(".account-status").textContent=error.message;return}
 const name=user?.user_metadata?.full_name||user?.user_metadata?.name||"Prem PK";
 back.querySelector(".account-avatar").textContent=initials(name);
 back.querySelector(".account-identity strong").textContent=name;
 back.querySelector(".account-identity small").textContent=user?.email||"Email not available";
 back.querySelector(".account-signout").addEventListener("click",async()=>{
  const btn=back.querySelector(".account-signout");btn.disabled=true;btn.textContent="Signing out…";
  const {error}=await supabase.auth.signOut();
  if(error){back.querySelector(".account-status").textContent=error.message;btn.disabled=false;btn.textContent="Sign out";return}
  location.replace("auth.html");
 });
}
document.querySelectorAll(".profile,.top-avatar").forEach(el=>{
 el.setAttribute("role","button");el.setAttribute("tabindex","0");el.setAttribute("aria-label","Open account and sign out");
 el.addEventListener("click",openAccount);
 el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openAccount()}});
});
