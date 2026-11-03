/* WA Studio public client configuration. Publishable keys are intended for browser use. */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm";
export const SUPABASE_URL = "https://awarqemysybvcrrehzrw.supabase.co";
export const SUPABASE_KEY = "sb_publishable_Xz3CF1lHguErQYvx44dUxg_KxF32nV-";
export const API_URL = "https://wa-studio-api.prem92006.workers.dev";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
export async function api(resource, {method="GET", id, body}={}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in first.");
  const url = new URL(API_URL + "/api/" + encodeURIComponent(resource));
  if (id) url.searchParams.set("id", id);
  const response = await fetch(url, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      authorization: "Bearer " + session.access_token,
      ...(body ? {"content-type":"application/json"} : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || result.error || "API request failed (" + response.status + ")");
  return result;
}
