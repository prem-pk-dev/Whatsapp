# WA Studio — WhatsApp Communication Workspace

Premium, responsive frontend for consent-based customer communication.

## Working frontend modules
- Overview dashboard and responsive navigation.
- Contacts: create, edit, delete, search, filter, CSV import/export, duplicate detection and consent status.
- Campaigns: create, edit and delete local campaign drafts; scheduled status requires a valid future date.
- Inbox: create local conversations, save local message drafts, and hand off a prefilled message to WhatsApp using click-to-chat (the user reviews and sends it).
- Groups: save group plans and copy invitation wording; add and open a WhatsApp invite URL created in WhatsApp. No forced member additions.
- Automations: create, pause/resume and delete local rule drafts.
- Templates: create, edit and delete local message template drafts.
- Analytics: live counts from browser-local demo data; no fabricated provider delivery statistics.
- Settings: save local workspace preferences.

## Run / deploy
Open `index.html` in a browser or publish this repository with GitHub Pages. It is a static site; no build command is required.

## Data and limitations
This build uses browser LocalStorage. Data is local to one browser/device and is not a multi-user database. Clearing browser storage may remove it. Do not store API tokens, secrets, or sensitive customer information in this public frontend.

The inbox, campaign actions, automation rules, group plans, and templates are frontend workflows and do not deliver WhatsApp messages. The Groups page stores plans and invitation copy only; it does not create a WhatsApp group or add participants.

## Real WhatsApp integration
Real inbound/outbound messaging requires the official WhatsApp Business Platform, a server-side integration, secure credentials, webhook endpoints, business onboarding and compliance with opt-in/template policies. Messages to customers must be expected and permission-based. Business-initiated messages may require approved templates. Group capabilities are subject to WhatsApp eligibility and invite-based joining.

Official starting point: https://whatsappbusiness.com/developers/developer-hub/

## Design
- Premium evergreen and mint palette.
- Manrope / DM Sans typography with system fallbacks.
- Lucide icons, responsive layout and subtle transitions.
