# Prompt for the implementing agent

Copy everything below the line into the coding agent that works on the LanuBoard app.

---

Implement the new LanuBoard login page so it looks and behaves **exactly** like the approved design.

Everything you need is in `design/login/` (branch `claude/lanuboard-login-redesign-qukldi` of
`AndreiMst98/LanuBoard`; if the app lives in another repository, copy that folder in first):

1. Read `design/login/README.md` completely before writing code. It is the spec: scope, the two layouts and the
   1000px breakpoint, tokens, components, states, copy and behaviour, every animation, accessibility, and the
   acceptance checks.
2. Run `node design/login/reference/serve.mjs` and open `reference/desktop.html` and `reference/mobile.html`.
   These two pages are the pixel and motion reference. Copy their CSS values and keyframes verbatim; do not
   approximate, restyle or translate them into utility classes.
3. Build the page in the app's existing stack, on the app's login route, using `tokens.css`, the files in
   `assets/` (self-hosted fonts, logo, cube pattern) and the strings in `i18n/` (RO, DE, EN).
4. Wire the form to the app's real authentication (find the existing endpoint/session logic), following
   "Submit flow" in the README: empty fields → `required`, wrong credentials → `error`, network/5xx →
   `networkError`, success → brief success state, then redirect. Implement "Remember me" with the session
   mechanism the backend already has.
5. Do not add: Google/SSO login, sign-up, forgot-password, legal links, or a slogan.
6. Support `?lang=` and `?state=` in dev/test builds only, then verify:
   - `node design/login/reference/screenshots.mjs /tmp/impl-shots http://localhost:<port>/login`
     → compare all 17 images with `design/login/screenshots/` (visually and with a pixel diff);
   - `node design/login/reference/motion-frames.mjs /tmp/impl-motion http://localhost:<port>/login`
     → compare with `design/login/screenshots/motion/`;
   - go through the manual checklist in README §12, including keyboard-only use and `prefers-reduced-motion`.
   Fix every difference beyond anti-aliasing before you call it done, and report what you compared.
7. Commit on a feature branch and open a pull request with the side-by-side screenshots.

If something in the spec is ambiguous, follow the reference page; if the reference does not cover it, ask
instead of inventing UI.
