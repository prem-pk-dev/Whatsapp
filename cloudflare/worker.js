const DB = "https://awarqemysybvcrrehzrw.supabase.co";
const ORIGIN = "https://prem-pk-dev.github.io";
const ALLOWED = ["contacts","campaigns","conversations","messages","templates","automation_rules","group_plans","settings"];

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": ORIGIN,
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "authorization,apikey,content-type,prefer",
    "vary": "Origin",
    "cache-control": "no-store"
  }
});

async function handle(request) {
  const origin = request.headers.get("Origin") || "";
  if (origin && origin !== ORIGIN) return json({ error: "Origin not allowed" }, 403);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: {
      "access-control-allow-origin": ORIGIN,
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "authorization,apikey,content-type,prefer",
      "vary": "Origin"
    }});
  }

  const url = new URL(request.url);
  if (url.pathname === "/health") {
    return json({ ok: true, service: "wa-studio-api", version: "0.3.0", database: "supabase-configured", whatsapp: "not-configured" });
  }
  if (!url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);

  const authorization = request.headers.get("authorization") || "";
  const apikey = request.headers.get("apikey") || "";
  if (!/^Bearer\s+\S+/i.test(authorization) || !apikey) return json({ error: "Supabase session required" }, 401);

  const authResponse = await fetch(DB + "/auth/v1/user", { headers: { authorization, apikey } });
  if (!authResponse.ok) return json({ error: "Invalid session" }, 401);
  const user = await authResponse.json();
  const table = url.pathname.split("/")[2];
  if (!ALLOWED.includes(table)) return json({ error: "Unknown resource" }, 404);

  const method = request.method;
  const params = new URLSearchParams({ user_id: "eq." + user.id });
  if (method === "GET") {
    params.set("select", "*");
    params.set("limit", "1000");
    if (url.searchParams.has("id")) params.set("id", "eq." + url.searchParams.get("id"));
  } else if (["POST","PATCH","DELETE"].includes(method)) {
    if (method !== "POST") {
      if (!url.searchParams.has("id")) return json({ error: "id required" }, 400);
      params.set("id", "eq." + url.searchParams.get("id"));
    }
  } else return json({ error: "Method not allowed" }, 405);

  let body;
  if (method === "POST" || method === "PATCH") {
    try { body = await request.json(); } catch { return json({ error: "JSON required" }, 400); }
    if (!body || Array.isArray(body) || typeof body !== "object") return json({ error: "Object required" }, 400);
    delete body.user_id;

    // Server-side consent enforcement: never trust the browser's audience snapshot.
    if (table === "campaigns") {
      const ids = body.audience_contact_ids;
      if (!Array.isArray(ids) || ids.length === 0 || ids.some(id => typeof id !== "string")) {
        return json({ error: "Select at least one opted-in recipient" }, 400);
      }
      const uniqueIds = [...new Set(ids)];
      if (uniqueIds.length !== ids.length) return json({ error: "Duplicate recipients are not allowed" }, 400);

      const contactUrl = DB + "/rest/v1/contacts?select=id,consent,consent_status&user_id=eq."
        + encodeURIComponent(user.id) + "&id=in.(" + uniqueIds.map(encodeURIComponent).join(",") + ")";
      const contactsResponse = await fetch(contactUrl, { headers: { authorization, apikey } });
      if (!contactsResponse.ok) return json({ error: "Could not verify recipient consent; campaign was not saved" }, 503);

      const contacts = await contactsResponse.json();
      const optedIn = new Set(contacts
        .filter(contact => contact.consent_status === "granted" || (contact.consent_status == null && contact.consent === true))
        .map(contact => contact.id));
      const invalidIds = uniqueIds.filter(id => !optedIn.has(id));
      if (invalidIds.length) {
        return json({ error: "Consent check failed: " + invalidIds.length + " selected contact(s) are not opted in. Campaign was not saved." }, 409);
      }
      body.audience_contact_ids = uniqueIds;
    }
  }

  const headers = { authorization, apikey, prefer: "return=representation" };
  if (body) headers["content-type"] = "application/json";
  if (method === "POST") body.user_id = user.id;

  if (method === "GET") params.set("order", (table === "conversations" || table === "settings") ? "updated_at.desc" : "created_at.desc");
  const endpoint = DB + "/rest/v1/" + table + (method === "POST" ? "" : "?" + params.toString());
  const response = await fetch(endpoint, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return new Response(await response.text(), {
    status: response.status,
    headers: { "content-type": "application/json", "access-control-allow-origin": ORIGIN, "vary": "Origin", "cache-control": "no-store" }
  });
}

addEventListener("fetch", event => event.respondWith(handle(event.request)));
