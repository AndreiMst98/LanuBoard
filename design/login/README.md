# LanuBoard — Login page · implementation handoff

This folder is everything needed to build the new LanuBoard login page so that it looks and moves
**exactly** like the approved design. It was exported from the design canvas and checked in headless Chromium.

> **For the implementing agent:** read this file top to bottom, open the two reference pages, then build.
> The reference pages are the source of truth for every pixel and every millisecond. When this text and a
> reference page disagree, the reference page wins. Do not "improve", restyle or approximate anything.

---

## 1. What's in here

```
design/login/
├── README.md                ← this spec
├── AGENT_PROMPT.md          ← short prompt to hand to the implementing agent
├── tokens.css               ← every colour, radius, shadow, size, easing as CSS variables
├── reference/
│   ├── desktop.html         ← PIXEL REFERENCE, desktop layout (design frame 1440×900)
│   ├── mobile.html          ← PIXEL REFERENCE, mobile layout (design frame 390×844)
│   ├── serve.mjs            ← static server: node design/login/reference/serve.mjs  → http://127.0.0.1:4173/…
│   ├── screenshots.mjs      ← captures the 17 static target shots (reference or your build)
│   ├── motion-frames.mjs    ← freezes animations at fixed times and captures frames (reference or your build)
│   └── sync-i18n.mjs        ← copies i18n/*.json into the reference pages after a string change
├── i18n/ro.json · de.json · en.json   ← all copy, 3 languages, same keys
├── assets/
│   ├── lanu-logo-on-dark.png      ← logo for navy backgrounds: blue cube, white lettering (640×459, transparent)
│   ├── lanu-logo-white.png        ← all-white variant (spare; not used by default)
│   ├── lanu-logo-original.webp    ← original logo from LANU (blue + grey, for light backgrounds)
│   ├── pattern-cubes-on-dark.svg  ← background tile for the navy panel (white lines, 3.5% opacity)
│   ├── pattern-cubes-on-light.svg ← same tile for light backgrounds (spare; not used by default)
│   └── fonts/                     ← self-hosted Bricolage Grotesque + Instrument Sans (woff2) + fonts.css
└── screenshots/             ← target images (static states) + screenshots/motion/ (animation frames)
```

**Open the references over HTTP, not `file://`.** `node design/login/reference/serve.mjs` and open the
printed URLs. (The mobile logo light-sweep uses a CSS `mask-image`, which browsers block on `file://`.)
Demo query params on both pages: `?lang=ro|de|en` and `?state=error|network|loading|success`.

---

## 2. Scope

**Build:** the `/login` page of LanuBoard (use the app's existing login route if it has one) — responsive,
three languages, all states and all animations below, wired to the app's real authentication.

**Do NOT build** (deliberately removed from the design — do not add them back):
- "Continue with Google" / any SSO button
- "Don't have an account? Create account"
- "Forgot password?" link
- Terms / Privacy / Help links
- A slogan line under the panel headline

---

## 3. Layouts and breakpoint

There are two layouts. They are different compositions, not one layout squeezed.

| Viewport width | Layout | Reference |
|---|---|---|
| **≥ 1000px** | **Desktop split**: navy brand panel left, form right, side by side | `reference/desktop.html` |
| **< 1000px** | **Mobile**: navy header with centred hero logo, light "sheet" with the form below | `reference/mobile.html` |

Why 1000px: the split uses `flex: 1 1 520px` + `flex: 1 1 480px`; below 1000px the two halves would wrap,
which is not a designed state. Use exactly one form in the DOM; switch the surrounding composition
(CSS media query or a `matchMedia` hook). The language switcher lives on the form side on desktop and in
the navy header on mobile.

Targets: 1440×900 and 1280×800 (desktop), 1024×768 (smallest desktop), 390×844 (design phone),
375×667 (small phone), 768×1024 (tablet → mobile layout, form column max 440px, centred).
See `screenshots/` for each.

---

## 4. Design tokens

All values live in `tokens.css`. Use the variables; never re-pick a colour by eye.

| Token | Value | Used for |
|---|---|---|
| `--lb-navy` | `#0C1B35` | brand panel, mobile background, primary button, active language pill (desktop) |
| `--lb-blue` | `#136EB4` | LANU blue (exact, from the logo): highlight card, links, focus border, checked checkbox, success button |
| `--lb-blue-dark` | `#0D4A7A` | link hover |
| `--lb-charcoal` | `#363636` | LANU grey (exact, from the logo): h1, labels, input text, inactive language (desktop) |
| `--lb-page` | `#F4F6F9` | form side (desktop), sheet (mobile) |
| `--lb-text-muted` | `#5B6470` | subtitle, footer, password-toggle icon (5.4:1 on page) |
| `--lb-placeholder` | `#7D8691` | placeholders, idle field icons |
| `--lb-border-input` | `#8F98A3` | input and checkbox borders (3:1 on white) |
| `--lb-border-subtle` | `#DCE1E7` | desktop language switcher outline |
| `--lb-error-*` | text `#9A3412`, bg `#FFF4ED`, border `#F3C3A8`, field `#C2410C` | error alert, invalid inputs |
| `--lb-focus-ring` | `0 0 0 3px rgba(19,110,180,.20)` | focused input |
| `--lb-shadow-card` | `0 20px 40px rgba(0,0,0,.40)` | blue highlight card |
| `--lb-shadow-button-hover` | `0 10px 24px rgba(12,27,53,.28)` | primary button hover |
| radii | 6 checkbox · 9 language buttons/pill · 10 inputs/button/alert · 12 switcher/cards · 24 mobile sheet · 999 tags | |

**Typography** (fonts are in `assets/fonts/` — self-host them; do not load from Google at runtime:
LANU Services GmbH is a German company and remote Google Fonts are a GDPR problem in Germany).

| Role | Font | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| Panel headline (desktop) | Bricolage Grotesque | 56 / 1.02 | 700 | −0.025em |
| Panel headline (mobile) | Bricolage Grotesque | 34 / 1.05 | 700 | −0.025em |
| h1 "Intră în cont" desktop / mobile | Bricolage Grotesque | 36 / 1.1 · 28 / 1.1 | 700 | −0.02em |
| Subtitle desktop / mobile | Instrument Sans | 16 / 1.5 · 15 / 1.5 | 400 | — |
| Labels | Instrument Sans | 14 | 600 | — |
| Inputs | Instrument Sans | 16 (never smaller: iOS zoom) | 400 | — |
| Button | Instrument Sans | 16 | 600 | — |
| Language buttons desktop / mobile | Instrument Sans | 14 · 13 | 600 | 0.04em |
| "LANUBOARD" tag desktop / mobile | Instrument Sans, uppercase | 13 · 12 | 600 | 0.1em |
| Error alert | Instrument Sans | 14 / 1.45 (mobile 1.4) | 400 | — |
| Footer | Instrument Sans | 13 | 400 | — |
| Cursor tag "Echipa" | Instrument Sans | 11 | 700 | 0.02em |

---

## 5. Layout — desktop (≥ 1000px)

Root: `min-height: 100vh`, flex row, background `--lb-page`, font `--lb-font-body`, colour `--lb-charcoal`.

**Brand panel** — `flex: 1 1 520px` (740px wide at 1440), padding `40px 56px`, background `--lb-navy` +
`pattern-cubes-on-dark.svg` tiled at `51.9615px 90px`, column, `justify-content: space-between`, gap 48, `overflow: hidden`.
1. **Logo** `lanu-logo-on-dark.png`, height 104px (≈145px wide), top-left, not a link, `alt="LANU Services GmbH"`.
2. **Board illustration** (`aria-hidden`, purely decorative): 3-column grid, gap 16, max-width 540.
   Columns start 0 / 32 / 64px lower. Each column: header row (8px dot + 8px bar) then cards
   (padding 14, radius 12, bg `--lb-on-navy-card`, 1px border `--lb-on-navy-card-border`, skeleton bars 8px high, radius 4).
   Column 2 holds the **blue card** (`--lb-blue`, rotated −3°, `--lb-shadow-card`, two white bars, a tag and two
   overlapping 20px avatars) with the **"Echipa" cursor** attached (hidden at rest). Column 3 ends in a
   **drop slot** (72px tall, 1.5px dashed `rgba(255,255,255,.4)`, radius 12). Copy every bar width, colour and
   offset from `reference/desktop.html` — they are exact.
3. **Headline block** (max-width 520, gap 16): outlined tag "LANUBOARD", then the headline (white).

**Form side** — `flex: 1 1 480px`, padding `32px 24px`, column, gap 32:
1. Language switcher, right-aligned (§7).
2. Form, centred vertically and horizontally, `max-width: 400px`, column gap 24:
   title block (h1 + subtitle, gap 8) → [error alert] → fields (gap 16) → checkbox row → submit button.
3. Footer, centred: `© 2026 LANU Services GmbH`.

## 6. Layout — mobile (< 1000px)

Root: full width, `min-height: 100dvh` (fallback `100vh`), column, background `--lb-navy` + cube pattern.
The page simply scrolls when content is taller than the screen (e.g. German error message).

**Header** — padding `20px 24px 40px`, column, centred, gap 16, white text:
1. Row, full width, `min-height: 52px`: language switcher right-aligned (§7, light-on-dark variant).
2. **Hero logo** `lanu-logo-on-dark.png`, height 112px (≈156 wide), centred, with the light-sweep overlay (§9).
3. Headline block (gap 12, centred): tag "LANUBOARD" (12px, padding 4×10), headline (max-width 320, centred).

**Sheet** — `flex: 1`, `margin-top: -20px` (overlaps the header), padding `28px 24px 24px`,
radius `24px 24px 0 0`, background `--lb-page`. Form `max-width: 440px`, centred, column gap 16. Same form as
desktop but h1 28px, subtitle 15px, alert padding 10×12. **No footer on mobile.** No board illustration on mobile.

---

## 7. Components and states

| Component | Spec | States |
|---|---|---|
| **Language switcher** (desktop) | container: padding 3, gap 2, radius 12, 1px `--lb-border-subtle`, white bg. Buttons `RO` `DE` `EN`: min 52×44, radius 9, transparent bg. Sliding pill 52×44, radius 9, `--lb-navy`, `translateX(index × 54px)` | active text white, inactive `--lb-charcoal` |
| **Language switcher** (mobile) | container: border `rgba(255,255,255,.3)`, bg `rgba(255,255,255,.08)`. Buttons min 44×44, 13px. Pill 44×44 white, `translateX(index × 46px)` | active text `--lb-navy`, inactive white |
| **Text input** | height 48, radius 10, 1px `--lb-border-input`, white, 16px; left icon 20px at `left 14 / top 14` (envelope for email, padlock for password), text padding-left 44 | focus: border `--lb-blue` + `--lb-focus-ring`, icon `--lb-blue` and scale 1.12 · invalid (`aria-invalid="true"`): border `--lb-error-field` (also while focused) |
| **Password toggle** | 44×44 button inside the field, `right 2 / top 2`, icon 20 `--lb-text-muted`; field padding-right 52 | eye ↔ eye-off; `aria-label` "Arată parola" ↔ "Ascunde parola" (per language) |
| **Checkbox** "Ține-mă minte…" | custom 20×20 box, radius 6, 1.5px `--lb-border-input`; native `<input type=checkbox>` stays in the DOM (opacity 0, on top of the box) for a11y; row min-height 44 | checked: box `--lb-blue`, white tick drawn in · focus-visible: 2px `--lb-blue` outline offset 2 · press: box scales .86 |
| **Primary button** | full width, height 52, radius 10, `--lb-navy`, white 16/600, label + 20px arrow, gap 10 | hover (pointer devices): lift 1px, `--lb-shadow-button-hover`, arrow +4px, light sheen sweeps across · active: scale .99 (mobile .98) · loading: 18px spinner + "Se conectează…", `aria-busy="true"`, ignore further submits · success: bg `--lb-blue`, drawn check + "Conectat" |
| **Error alert** | `role="alert"`, padding 12×14, radius 10, `--lb-error-bg`, 1px `--lb-error-border`, text `--lb-error-text` 14/1.45, 20px alert icon, gap 10. Sits between the title block and the fields | appears with a shake; hidden again as soon as the user edits the invalid field(s) |
| **Focus** (everywhere) | buttons/links: 2px `--lb-blue` outline, offset 2 (white outline on the navy panel/header) | keyboard only (`:focus-visible`) |

---

## 8. Copy, languages, behaviour

All strings are in `i18n/*.json` (same keys in all three). Examples:

| key | RO | DE | EN |
|---|---|---|---|
| `title` / `submit` | Intră în cont | Anmelden | Sign in |
| `headline` | Tabla ta te așteaptă. | Ihr Board wartet auf Sie. | Your board is waiting. |
| `subtitle` | Bine ai revenit! Introdu datele contului tău. | Willkommen zurück! Geben Sie Ihre Zugangsdaten ein. | Welcome back! Enter your account details. |
| `error` | Emailul sau parola nu se potrivesc. Verifică-le și încearcă din nou. | E-Mail-Adresse und Passwort passen nicht zusammen. … | That email and password don’t match. … |

German uses the formal "Sie" on purpose. Keys `required` and `networkError` were added for the
edge cases below (not drawn on the canvas, styled exactly like `error`).

**Language**
- Initial language: saved choice (persist in `localStorage` key `lb-lang` or the app's existing locale cookie)
  → else the first of `navigator.languages` that is `ro`, `de` or `en` → else `ro`.
- Switching: update every string, `<html lang>`, the password-toggle label and the switcher (`aria-pressed`),
  persist the choice, and play the switch animation (§9). If the app already has an i18n library, put these
  keys into it under a `login.` namespace instead of a custom loader.

**Submit flow** (the references use a fake timer — replace it with the real auth call)
1. Empty email or password → do not call the API. Mark each empty field `aria-invalid="true"`, show the
   alert with `required`, focus the first empty field.
2. Otherwise → **loading** state until the request settles. Ignore repeat submits.
3. Wrong credentials (e.g. 401/400) → **error** state: alert with `error`, both fields `aria-invalid`. Keep the
   typed email; clear nothing else.
4. Network failure / 5xx / timeout → alert with `networkError`, fields not marked invalid.
5. Success → **success** state (blue button, drawn check, "Conectat") for ~600ms, then redirect to the app's
   post-login route (or `?next=` if the app supports it).
6. Editing a field removes its `aria-invalid`; when no field is invalid the alert disappears.

**Remember me** → unchecked by default; checked = persistent session (long-lived cookie/refresh token);
unchecked = session that ends when the browser closes. Use whatever the backend already supports.

**Inputs**: email `type="email" name="email" autocomplete="username" required`; password
`type="password" name="password" autocomplete="current-password" required`. Real `<form>` with a submit button
so Enter submits and password managers work.

---

## 9. Motion

All keyframes, durations, delays and easings are in the `<style>` of the two reference pages —
**copy them verbatim** (class names may be renamed; values may not). Overview:

**Desktop — entrance** (t = 0 at first paint)

| Element | Animation | Duration | Delay | Easing |
|---|---|---|---|---|
| Brand panel | curtain reveal `clip-path: inset(0 100% 0 0) → inset(0)` | 900ms | 0 | `--lb-ease-curtain` |
| Logo | fade + scale .88 + 8px up → rest | 900ms | 250 | `--lb-ease-out` |
| Language switcher, title, email, password, checkbox, button, footer | fade + 14px up (`lbIn`) | 600ms | 0, 60, 120, 180, 240, 300, 360 | `--lb-ease-out` |
| Board columns 1/2/3, headline block | `lbIn` | 600ms | 60, 120, 180, 240 | `--lb-ease-out` |
| Skeleton bars | grow `scaleX(0→1)` from the left | 700ms | 450–850 (steps of 100) | `--lb-ease-out` |
| Avatars and tags in cards | pop `scale(0→1)` + fade | 500ms | 750–950 | `--lb-ease-overshoot` |
| Headline words | each word slides up out of its own clipped box | 800ms | 500 + 80 × word index | `--lb-ease-out` |

**Desktop — loops**

| Element | Animation | Timing |
|---|---|---|
| Blue card | picked up (−8px, −5°, ×1.04) → carried one column right into the drop slot (`translate(calc(100% + 16px), 127px)`, 0°) → rests → fades out → reappears at home | 9s loop, delay 1.6s, `--lb-ease-drag` |
| "Echipa" cursor | appears at pick-up, "clicks" (scale .82), rides with the card, clicks again on drop, fades | same 9s timeline |
| Drop slot | border brightens to `.85` and fills `rgba(19,110,180,.18)` while the card arrives/rests | same 9s timeline |
| Other cards | float −4px and back | 6s / 7s / 8s, delays 1s / 2s / 1.4s, ease-in-out |
| Blue dot (column 1) | ping ring `scale(1→3)`, `opacity(.7→0)` | 2.4s loop, delay 1s |
| Cube pattern | drifts one tile diagonally (`background-position → 51.9615px 90px`) | 80s linear loop |

**Desktop — interaction**
- **Parallax** (pointer only): on `mousemove` over the panel, `(pointer / panel size − 0.5) × depth` px,
  depths: column 1 −8, column 2 −16, column 3 −12, headline −6; `transition: transform 500ms --lb-ease-out`;
  throttled with `requestAnimationFrame`; resets on `mouseleave`. Column 2 is `z-index: 2` so the dragged card
  passes over column 3.

**Mobile**

| Element | Animation | Timing |
|---|---|---|
| **Hero logo** | starts at half size where the old small logo sat (top-left: band padding-left, vertically centred in the 52px language row), fades in, holds, then grows and travels to its centred resting place | 1800ms, delay 100: 0–15% fade in, 15–40% hold, 40–100% travel with `--lb-ease-hero`; `transform-origin: 0 0` |
| Hero offset | **measured at runtime** (FLIP): `dx = bandLeft + paddingLeft − heroLeft`, `dy = bandTop + paddingTop + (52 − heroHeight/2)/2 − heroTop`, applied as `translate(dx, dy) scale(.5)` at 0–40%. At 390px it is `translate(-92.9px, -70px)`. Measure before enabling animations, with the `<img>` `width/height` attributes set so its box is known before it loads | |
| **Light sweep** | a 105° light band (white core, light-blue edges) crosses the logo **only where the logo is opaque** (`mask-image: url(lanu-logo-on-dark.png)` on an overlay the size of the logo) | first pass at 1.9s (right after landing), then every 6s; the sweep takes the first 22% (~1.3s), `ease-in-out` |
| Sheet | slides up 80px → 0 | 700ms, delay 150 |
| Language switcher / title / email / password / checkbox / button | `lbIn` | 60 / 300 / 360 / 420 / 480 / 540ms |
| "LANUBOARD" tag, headline words | `lbIn`, word reveal | 1300ms; words 1400 + 80 × index |
| Cube pattern | same 80s drift on the root | |

**Shared micro-interactions** (both layouts)
- Language switch: pill slides 350ms `--lb-ease-out`; button text colour 250ms; the form fades up 6px (450ms);
  the headline words replay. (Trick used: alternate two identical keyframe names so the animation restarts.)
- Input: border + ring 150ms; field icon colour 200ms and `scale(1.12)` 250ms `--lb-ease-overshoot`.
- Password toggle: incoming icon pops in (`scale(.6) rotate(-20deg) → rest`, 300ms overshoot).
- Checkbox: fill 200ms; tick draws (`stroke-dashoffset 12 → 0`, 300ms, delay 50); press scale .86.
- Button: hover lift/shadow 150/200ms, arrow +4px 200ms, sheen 800ms on hover (on press on mobile);
  success: background → blue 300ms, check pops (400ms overshoot) and draws (450ms, delay 120).
- Error alert: fade in + shake `−6, 5, −3, 2, 0px` (450ms, `--lb-ease-shake`), replayed every time it is shown.

**Reduced motion is mandatory**: under `prefers-reduced-motion: reduce` every animation and transition is off,
elements are shown in their final state, parallax is disabled, the spinner stops (the "Se conectează…" text
still shows). The static target screenshots are taken in exactly this mode.

`screenshots/motion/` shows frozen frames of the reference at fixed times
(e.g. `mobile-t1350ms.png` = logo mid-flight, `desktop-t6100ms.png` = card resting in the drop slot).

---

## 10. Accessibility checklist

- One `<h1>` (the form title). The panel headline is an `<h2>`. Its animated word spans are `aria-hidden`;
  a visually hidden copy of the full sentence sits inside the same `<h2>` (see `renderHeadline` in the references),
  so it reads as "Tabla ta te așteaptă." and not as run-together words.
- Every input has a visible `<label for>`; placeholders are examples only.
- Language switcher: `role="group"` with `aria-label` Limba / Sprache / Language; buttons have `aria-pressed`,
  `aria-label` with the full language name and their own `lang` attribute; `<html lang>` follows the choice.
- Password toggle: `aria-label` switches between show/hide, `aria-controls` points to the password input.
- Alert: `role="alert"`; invalid inputs get `aria-invalid="true"` (optionally `aria-describedby` → alert).
- Submit: `aria-busy="true"` while loading.
- Decorative parts (`aria-hidden="true"`): board illustration, cursor, light sweep. Logo `alt="LANU Services GmbH"`.
- Focus order (desktop): RO → DE → EN → email → password → show/hide → remember → submit.
  (Mobile: same order; the switcher is in the header.)
- All touch targets ≥ 44px. All text ≥ 4.5:1.

---

## 11. Implementation notes

- **Match the stack** of the LanuBoard app (framework, styling approach, folder conventions). If there is no
  frontend yet, any setup that serves this page is fine; plain HTML/CSS/JS ported from the references is acceptable.
- **Keep CSS values verbatim.** If the app uses Tailwind or a component library, put this page's styles in a
  plain CSS/CSS-module file instead of translating to utility classes — utilities round values and drift.
- Copy `assets/` into the app's static/public folder and fix the paths (`fonts.css` uses relative `url()`s).
- Use `tokens.css` variables in the port.
- Animations start once, on mount. Do not restart entrance animations on re-render (React: don't re-key the tree).
- The `?lang` and `?state` URL params are for visual testing; keep them in dev/test builds only
  (or behind a flag) so `screenshots.mjs` can capture your build. Never let `?state` fake a login in production.
- Do not add analytics, cookie banners, extra links or copy to this page as part of this task.

---

## 12. Acceptance criteria and how to verify

1. `node design/login/reference/screenshots.mjs /tmp/impl-shots http://localhost:<port>/login`
   produces the same 17 images as `design/login/screenshots/` (same names). Compare each pair visually,
   and with a pixel diff (e.g. `pixelmatch`, threshold 0.1): differences must be limited to
   anti-aliasing — no layout, colour, spacing, font or copy differences.
   (Needs Playwright: `npm i -D playwright`.)
2. `node design/login/reference/motion-frames.mjs /tmp/impl-motion http://localhost:<port>/login` matches
   `design/login/screenshots/motion/` frame by frame (run once at 1440×900 and once at 390×844 — the script does both).
3. Manual: language switching (pill slide, text fade, headline replay, `<html lang>`, persisted after reload);
   password toggle; checkbox tick; button hover/press; empty submit → `required`; wrong password → `error` + shake;
   offline → `networkError`; success → redirect; keyboard-only run through the whole form; reduced motion on.
4. No console errors; no layout shift once fonts load (fonts are preloaded/self-hosted, `font-display: swap`).

---

## 13. Decisions made / open questions for the product owner

- **Navy `#0C1B35`** was read by eye from a swatch image. If LANU has an exact brand hex, change `--lb-navy` only.
- **Default language** when nothing is saved and the browser is not ro/de/en: `ro` (as in the design). LANU is a
  German GmbH — switch the fallback to `de` if most users are German-speaking.
- **German form of address**: formal "Sie".
- **Empty-field and network-error messages** were not on the canvas; copy is in `i18n/*.json` (`required`, `networkError`).
- **Logo** is not a link on the login page (there is no public home page to link to).
- **Mobile** drops the board illustration in favour of the hero logo, by design.
