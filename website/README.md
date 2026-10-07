# LANU presentation website

Static website (HTML + CSS + JS, no build step) presenting LANU Board, LANU App and LANU MDM to companies that may buy them.
Languages: English and German (switch top right; first visit follows the browser language, choice is remembered).

## Run locally
Open `index.html` in a browser — that's all. Or serve the folder: `python3 -m http.server 8000` → http://localhost:8000

To send a single file for review: `python3 tools/build-preview.py` → `dist/lanu-website-preview.html` (everything inlined).

## Structure
- `index.html` — page structure
- `assets/i18n.js` — **all text, EN + DE** (edit copy here)
- `assets/site.js` — language switch, hero, interactive Operations tour (recreated app screen with fictional data), contact form
- `assets/site.css` — styles
- `assets/fonts/` — self-hosted fonts (no Google requests: GDPR) · `assets/img/` — logo, cube pattern

## Privacy
The Operations screen in the tour is rebuilt in code with **fictional names, route codes and numbers** (`NAMES` in `site.js`).
No real driver data and no screenshots of the real app are used.

## Before going live
- [ ] Contact details (email, phone) in `index.html` — currently placeholders in [brackets]
- [ ] Connect the contact form (e.g. Formspree, or the host's form service). Right now it only validates and shows a thank-you message.
- [ ] Imprint (Impressum) and Privacy (Datenschutz) pages — required in Germany
- [ ] LANU App and LANU MDM descriptions and sections
- [ ] Domain shown in the browser frame (`board.lanu.app`) — replace with the real one or remove

## Hosting
Any static host works (Netlify, Vercel, Cloudflare Pages, GitHub Pages, or a classic web host via FTP): upload the contents of this folder.
