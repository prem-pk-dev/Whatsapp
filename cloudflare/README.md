# WA Studio Cloudflare Worker

This directory contains the API Worker source used by the WA Studio frontend.

## Deploy

From the repository root, with Wrangler authenticated to the Cloudflare account that owns `wa-studio-api`:

```bash
npx wrangler deploy cloudflare/worker.js --name wa-studio-api --compatibility-date 2025-01-01
```

Keep the existing `workers.dev` hostname enabled for the `wa-studio-api` Worker. The frontend currently calls:

`https://wa-studio-api.prem92006.workers.dev`

## Verify after deployment

1. Open `https://wa-studio-api.prem92006.workers.dev/health`.
2. Expect JSON with `ok: true` and `version: "0.3.0"`.
3. Open the WA Studio site, sign in, and test contact/campaign CRUD.
4. Try saving a campaign with a pending or denied contact. The API should return HTTP 409 and not save it.
5. Try saving a campaign with a granted-consent contact. It should save successfully.

## Security notes

- The Worker validates the Supabase access token with Supabase Auth and forwards the caller JWT to PostgREST so row-level security remains active.
- Campaign create/update requests re-check selected contacts' current consent status on the server. If consent cannot be verified, the request fails closed.
- Do not add a Supabase service-role key to this file, GitHub, frontend code, or Worker plaintext variables.
- This Worker does not send WhatsApp messages. Meta WhatsApp Cloud API credentials, webhook verification, and message delivery are not configured.
- Browser-side checks are usability safeguards only; server-side checks are the enforcement layer.
