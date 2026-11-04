import { supabase } from "./backend.js";
const $=id=>document.getElementById(id);
let mode="login";
let pendingEmail="";
const setMode=(next)=>{
  mode=next;
  $("heading").textContent=mode==="login"?"Welcome back":"Create your workspace";
  $("subheading").textContent=mode==="login"?"Sign in to your secure workspace.":"Create an account with email verification.";
  $("submitBtn").textContent=mode==="login"?"Sign in":"Create account";
  $("switchText").textContent=mode==="login"?"New to WA Studio?":"Already have an account?";
  $("switchMode").textContent=mode==="login"?"Create account":"Sign in";
  $("passwordField").hidden=mode==="otp";
  $("otpField").hidden=mode!=="otp";
  $("switchMode").hidden=mode==="otp";
  $("otpHint").hidden=mode!=="otp";
  $("resendOtp").hidden=mode!=="otp";
  $("password").required=mode!=="otp";
  $("otp").required=mode==="otp";
  $("password").autocomplete=mode==="login"?"current-password":"new-password";
  $("error").textContent="";
};
$("switchMode").addEventListener("click",()=>setMode(mode==="login"?"signup":"login"));
$("resendOtp").addEventListener("click",async()=>{
  const button=$("resendOtp");button.disabled=true;$("error").textContent="";
  try{const {error}=await supabase.auth.resend({type:"signup",email:pendingEmail});if(error)throw error;$("error").textContent="A new verification code has been sent.";}
  catch(err){$("error").textContent=err.message||"Could not resend code.";}
  finally{button.disabled=false;}
});
(async()=>{const {data:{session}}=await supabase.auth.getSession();if(session)location.replace("index.html");})();
$("authForm").addEventListener("submit",async e=>{
  e.preventDefault();const button=$("submitBtn");button.disabled=true;
  button.textContent=mode==="login"?"Signing in…":mode==="otp"?"Verifying…":"Creating account…";
  $("error").textContent="";
  try{
    const email=$("email").value.trim(),password=$("password").value;
    if(mode==="login"){
      const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;
      location.replace("index.html");return;
    }
    if(mode==="signup"){
      const {data,error}=await supabase.auth.signUp({email,password});
      if(error)throw error;
      if(data.session){location.replace("index.html");return;}
      pendingEmail=email;$("otpHint").textContent="Enter the 6-digit code sent to "+email+".";
      setMode("otp");$("error").textContent="Verification code sent. Check your inbox and spam folder.";return;
    }
    const token=$("otp").value.replace(/\D/g,"");
    if(!/^\d{6}$/.test(token))throw new Error("Enter the complete 6-digit code.");
    const {error}=await supabase.auth.verifyOtp({email:pendingEmail||email,token,type:"signup"});
    if(error)throw error;
    location.replace("index.html");
  }catch(err){$("error").textContent=err.message||"Authentication failed.";}
  finally{button.disabled=false;button.textContent=mode==="login"?"Sign in":mode==="otp"?"Verify email":"Create account";}
});
$("otp").addEventListener("input",()=>{$("otp").value=$("otp").value.replace(/\D/g,"").slice(0,6);});
