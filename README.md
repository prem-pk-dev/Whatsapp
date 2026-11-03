# WA Studio — WhatsApp Communication Workspace

Premium, responsive frontend for consent-based customer communication.

## Working frontend modules
- Overview dashboard and responsive navigation.
- Contacts: create, edit, delete, search, filter, CSV import/export, duplicate detection and consent status.
- Campaigns: create, edit and delete campaign drafts; scheduled status requires a valid future date.
- Inbox: create conversations, save message drafts, and hand off a prefilled message to WhatsApp using click-to-chat (the user reviews and sends it).
- Groups: save group plans and copy invitation wording; add and open a WhatsApp invite URL created in WhatsApp. No forced member additions.
- Automations: create, pause/resume and delete rule drafts.
- Templates: create, edit and delete message template drafts.
- Analytics: demo/workspace counts only; no fabricated provider delivery statistics.
- Settings: save workspace preferences to the signed-in Supabase account.

## Run / deploy
Open `index.html` in a browser or publish this repository with GitHub Pages. The frontend is static; no build command is required.

## Data and current integration status
Most workspace module records are currently browser-local demo/workspace data. Settings and authentication use Supabase. Browser-local data is device-specific and may be lost if site data is cleared. Do not store API tokens, secrets, or sensitive customer information in this public frontend.

The Cloudflare Worker source is present in `cloudflare/worker.js`, but it is not yet deployed. Its health endpoint and API routes must not be treated as live until deployment is verified. The inbox, campaign actions, automation rules, group plans, and templates do not currently deliver WhatsApp messages. The Groups page stores plans and invitation copy only; it does not create a WhatsApp group or add participants.

## Real WhatsApp integration
Real inbound/outbound messaging requires the official WhatsApp Business Platform, a server-side integration, secure credentials, webhook endpoints, business onboarding and compliance with opt-in/template policies. Messages to customers must be expected and permission-based. Business-initiated messages may require approved templates. Group capabilities are subject to WhatsApp eligibility and invite-based joining.

Official starting point: https://whatsappbusiness.com/developers/developer-hub/

## Design
- Premium evergreen and mint palette.
- Manrope / DM Sans typography with system fallbacks.
- Lucide icons, responsive layout and subtle transitions.
