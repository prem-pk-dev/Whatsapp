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

## Manual regression matrix

Run these checks only after the Worker deployment is confirmed:

| Area | Positive test | Negative / boundary test |
| --- | --- | --- |
| Authentication | Signed-in user can load their records | Signed-out request receives HTTP 401 |
| Contacts | Create, edit, list, and delete a test contact | User A cannot read or change User B records |
| Campaigns | Save draft with one granted-consent contact | Pending, denied, unknown, or missing recipient IDs are rejected |
| Consent changes | Re-open editor after a contact opts out | Save must be rejected by the Worker with HTTP 409 |
| Inbox | Create a conversation and save a draft message | No WhatsApp message is sent by saving a draft |
| Automations | Create, pause, resume, and delete a rule | Rule must not be described as active auto-reply without webhook + Meta integration |
| Groups | Save and edit an invite plan | Do not claim the API creates WhatsApp groups or adds members |
| Templates | Save and edit a template draft | Do not claim a draft is approved by Meta |
| Analytics | Counts load for the signed-in account | Do not interpret database row counts as delivery/read/click metrics |

For every CRUD test, use disposable test records and verify the record belongs only to the signed-in account. Remove test records after verification.

## Security notes

- The Worker validates the Supabase access token with Supabase Auth and forwards the caller JWT to PostgREST so row-level security remains active.
- Campaign create/update requests re-check selected contacts' current consent status on the server. If consent cannot be verified, the request fails closed.
- Do not add a Supabase service-role key to this file, GitHub, frontend code, or Worker plaintext variables.
- This Worker does not send WhatsApp messages. Meta WhatsApp Cloud API credentials, webhook verification, and message delivery are not configured.
- Browser-side checks are usability safeguards only; server-side checks are the enforcement layer.
