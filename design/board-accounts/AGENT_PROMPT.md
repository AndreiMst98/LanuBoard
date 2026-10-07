# Prompt for the implementing agent

Copy everything below the line into the coding agent that works on the LanuBoard app.

---

Rebuild the **Board accounts** page of LanuBoard so it looks and behaves **exactly** like the approved redesign.

Everything you need is in `design/board-accounts/` (branch `claude/lanuboard-login-redesign-qukldi` of
`AndreiMst98/LanuBoard`; if the app lives in another repository, copy that folder in first):

1. Read `design/board-accounts/README.md` completely before writing code. It is the spec: scope, the permission
   model (role defaults vs. Custom accounts), layout, tokens, components and states, behaviour → API mapping,
   copy, motion, accessibility and the acceptance checks.
2. Run `node design/board-accounts/reference/serve.mjs` and use the reference page. It is the pixel and behaviour
   reference: copy its markup values and CSS verbatim; do not approximate, restyle or translate them into utility classes.
3. Replace the current Board accounts page in the app's existing stack. Keep the global app header as it is.
   Use `tokens.css`, the self-hosted font in `assets/fonts/`, and the strings in `i18n/` (EN as designed; RO/DE are
   drafts to align with the app's existing terms; section names come from the app's own translations).
4. Wire every action to the real backend (find the existing endpoints): list accounts and role defaults, edit account
   (send ticks only when they differ from the role defaults), set password, deactivate/reactivate, delete, create
   account, save role defaults. Follow README §7 for pending and failure states.
5. Remove the old per-row button row, the "adjusted" wording and the two checkbox walls with two Save buttons.
6. Support the demo query params from README §12 in dev/test builds only, with fixture data equal to the demo data
   in `reference/app.js`, then verify:
   - `node design/board-accounts/reference/screenshots.mjs /tmp/impl-shots http://localhost:<port>/<accounts-route>`
     → compare all 21 images with `design/board-accounts/screenshots/` (visually and with a pixel diff);
   - go through the manual checklist in README §12, including keyboard-only use and `prefers-reduced-motion`.
   Fix every difference beyond anti-aliasing before you call it done, and report what you compared.
7. Commit on a feature branch and open a pull request with side-by-side screenshots.

If something is ambiguous, follow the reference; if the reference does not cover it, ask instead of inventing UI.
