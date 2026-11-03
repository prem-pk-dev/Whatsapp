# WA Studio — WhatsApp Communication Workspace

A premium, responsive frontend prototype for consent-based WhatsApp customer communication.

## Current build
- Apple-inspired visual language: restrained surfaces, generous spacing, subtle translucency, refined typography and motion.
- Responsive dashboard with workspace navigation, KPI cards, performance chart, connection preview, activity feed and quick actions.
- Separate HTML/CSS/JavaScript assets; no build step required.
- Demo metrics are illustrative and do not represent live WhatsApp data.

## Run locally
Open `index.html` in a browser, or serve this folder with any static file server.

## Deploy
This is a static frontend and can be hosted on GitHub Pages or Vercel. Connect the repository and use the project root as the deployment root; no build command is required.

## WhatsApp integration boundary
The interface is currently a frontend demo. It does not send WhatsApp messages or create WhatsApp groups. Real messaging requires the official WhatsApp Business Platform, approved templates where applicable, valid opt-in, webhook handling and secure server-side credentials. Group invitation flows must allow people to choose to join; the app must not force-add members or automate unsolicited outreach.

## Design
- Font stack: system UI / DM Sans / Manrope.
- Palette: deep evergreen, soft mint, warm neutral canvas.
- Icons: Lucide.
- Charts: lightweight inline SVG.
