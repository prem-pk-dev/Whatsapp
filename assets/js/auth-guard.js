import {supabase} from "./backend.js";
const publicPages=["auth.html"];
(async()=>{const page=location.pathname.split("/").pop()||"index.html";if(publicPages.includes(page))return;const {data:{session}}=await supabase.auth.getSession();if(!session){location.replace("auth.html");return;}supabase.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT")location.replace("auth.html")});})();