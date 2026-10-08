# Andera website — upload instructions

The site is static: one `index.html` plus an `assets/` folder. No database, no PHP, no build step on the server.

## What to upload

`andera-website.zip` (about 670 KB) contains:

```
index.html
assets/
  site.css
  site.js
  i18n.js
  fonts/   (4 .woff2 files + fonts.css)
  img/     (logo, favicon, app/ and fleet/ images)
```

After upload, the web root of the domain must look exactly like this: `index.html` directly in the root, `assets/` next to it. Not inside an extra subfolder such as `andera-website/`.

## Steps

1. Log in to the hosting control panel (cPanel, hPanel, Plesk, IONOS, Strato and similar).
2. Open the **File Manager**. Go to the domain's web root. It is usually one of:
   - `public_html/` (cPanel, Hostinger)
   - `httpdocs/` (Plesk, Strato)
   - `htdocs/` or `/` (IONOS)
   - for an addon domain: `public_html/<domain>/`
3. If the root has a default page (`index.html`, `index.php`, `default.php`, `default.html`), delete it or rename it to `old-<name>`. Leave `.htaccess`, `cgi-bin`, `.well-known` and other system files alone.
4. Upload `andera-website.zip` into the web root.
5. Select the zip and choose **Extract** into the same folder. If the panel creates a subfolder, move `index.html` and `assets/` up into the web root.
6. Delete the zip from the server after extracting.
7. Turn on **SSL / HTTPS** for the domain. Most hosts offer a free Let's Encrypt certificate under SSL, Security or Domains. Enable **force HTTPS / redirect HTTP to HTTPS** if offered.
8. If the host has a caching or CDN option, purge the cache once.

## Check after upload

Open `https://<domain>/` in a private window and confirm:

- The hero shows the Andera Group logo top left and the animated block city. The three slides change on their own.
- **EN / DE** switches the language.
- Scrolling down, every section has its picture: the uniform jacket, the safety shoe, the white phone and the white van photo.
- No broken images. Developer tools, Network tab: no red 404 lines.
- The padlock (HTTPS) shows in the address bar.
- On a phone, the page fits the screen without sideways scrolling.

If images or styles are missing, the files are almost always one folder too deep. Move `index.html` and `assets/` up into the web root.

## File permissions (only if something does not load)

- Folders: `755`
- Files: `644`

## Not done yet (do not announce the site publicly before these)

- **Contact email:** shows the placeholder `[email@andera-group.de]` until the real address is set.
- **Contact form:** shows a thank-you message but does not send anything yet. It needs a form service or an email endpoint.
- **Imprint (Impressum) and Privacy (Datenschutzerklärung):** the footer links lead nowhere. They are legally required for a company website in Germany.
- **Product descriptions:** the Andera App and Andera MDM cards still show placeholder text.

## Updating later

Upload a new `andera-website.zip` the same way and overwrite the existing files. Purge the host's cache if it has one.
