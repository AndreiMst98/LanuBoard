# LanuBoard — Board accounts page · implementation handoff

Everything needed to rebuild the **Board accounts** page (create accounts for Dispatchers, Managers and Admins
and choose which Board sections each one can open) so it looks and behaves **exactly** like the approved redesign.
It keeps the app's existing colours; the layout and flows are new and simpler.

> **For the implementing agent:** read this file top to bottom, run the reference, then build. The reference
> (`reference/index.html` + `app.js` + `app.css`) is the source of truth for every pixel and every interaction.
> When this text and the reference disagree, the reference wins. Do not restyle, "improve" or approximate.

---

## 1. What's in here

```
design/board-accounts/
├── README.md              ← this spec
├── AGENT_PROMPT.md        ← short prompt to hand to the implementing agent
├── tokens.css             ← every colour, radius, shadow and size as CSS variables
├── reference/
│   ├── index.html         ← the page (open it over http, see below)
│   ├── app.js             ← all markup (inline styles copied 1:1 from the design), state and behaviour, demo data
│   ├── app.css            ← hover, focus, motion and the few shared classes
│   ├── serve.mjs          ← static server: node design/board-accounts/reference/serve.mjs → http://127.0.0.1:4173/
│   └── screenshots.mjs    ← captures the 21 target shots (from the reference, or from your build)
├── i18n/en.json           ← every UI string of the page (source = English, as designed)
├── i18n/ro.json · de.json ← DRAFT translations — align wording with the app's existing RO/DE terms
├── assets/fonts/          ← Instrument Sans (self-hosted woff2 + fonts.css)
└── screenshots/           ← the target images (21 states)
```

Run `node design/board-accounts/reference/serve.mjs` and open the printed URL. Everything is clickable:
tabs, filters, search, the ⋯ menu, both side panels, ticks, role change, validation, save, delete.

---

## 2. Scope

**Build:** the Board accounts page in the LanuBoard app, replacing the current one, wired to the real data and API.

**Keep as is:** the global app header (menu button, page title + date, RO/DE/EN switch, dark-mode button,
user, sign-out). It is shared by every page; the reference only redraws it for context.

**Remove** (they are replaced by the new design): the per-row Edit / Password / Deactivate / Delete button row,
the "adjusted" wording, the two side-by-side checkbox walls for Dispatcher and Manager with their two Save buttons.

**Do not change:** section names, the list of sections and sub-pages, how permissions are enforced elsewhere in the app.

---

## 3. How the page works (information architecture)

```
Board accounts  [+ New account]
├── Tab "Accounts (7)"      → filter chips (All · Admins · Managers · Dispatchers) + search
│   └── table: Person · Role · Access · Last sign-in · [Edit] [⋯ Change password / Deactivate / Delete account…]
│        Edit  → side panel "Edit account": Profile · Role · Access (tree) · Sign-in and account
│        ⋯     → shortcuts into the same panel (password row open / delete confirmation open) or deactivate in place
├── Tab "Role permissions"  → ONE table: sections × (Dispatcher, Manager, Admin) + Discard / Save permissions
└── New account             → side panel "New account": Person (name, email, password) · Role · Access
```

**Permission model (unchanged in substance, clearer in the UI):**
- Each role has **default ticks** (Role permissions tab). Admin = every section, always, locked.
- An account either **follows its role's defaults** or has **its own ticks**. The UI calls the second case
  **Custom** (was "adjusted"). Custom = the account's ticks differ from its role's current defaults.
- Changing an account's role resets its ticks to the new role's defaults (the user can then customise again).
- Saving role defaults affects every account that follows them; Custom accounts keep their own ticks.
- A section with sub-pages is "fully ticked" (all sub-pages → also gets sub-pages added later) or
  "partly ticked" (only the ticked sub-pages). A partly ticked section shows a dash instead of a tick.
- "N of 15 sections" counts top-level sections with at least one ticked page.

Default ticks today: **Dispatcher** = Operations, Delivery Associates, Company phones, Housing, Equipment,
Recruiting, Planning (all), Timesheets (all), Fleet (all), GPS → 10/15. **Manager** = everything except Back Office → 14/15.
(Read the real values from the backend; these are only the demo data.)

---

## 4. Design tokens

All in `tokens.css` (sampled from the current app). Key ones:

| Token | Value | Used for |
|---|---|---|
| `--ba-primary` | `#2F6BFF` | primary buttons, active tab underline, checked boxes, selected role card border, focus |
| `--ba-primary-hover` | `#1F54D6` | primary hover, blue text (Custom tag, links, counts) |
| `--ba-ink` | `#0B1B34` | text, headings, the active filter chip |
| `--ba-text-muted` / `--ba-text-subtle` | `#56607A` / `#6B7489` | secondary text / table headers, counts, "Never signed in" |
| `--ba-page` / `--ba-surface` / `--ba-surface-alt` | `#F3F4F7` / `#FFFFFF` / `#FAFBFC` | page / cards / header rows, sub-page rows |
| `--ba-border` / `--ba-divider` | `#E3E6EE` / `#EDF0F5` | card & button borders / row dividers |
| Role badges | Admin `#DDF3E6`/`#146C3E`, Manager `#E2EAFF`/`#1F54D6`, Dispatcher `#EEF0F5`/`#56607A` (+ dot colours) | role pills everywhere |
| `--ba-danger*` | `#A32D2D` text, `#FDEEEE` bg, `#E8BDBD` border | delete |
| `--ba-info-*` | `#EEF3FF` bg, `#C9D7FF` border | Custom banner, Custom tag outline, Added/Removed tags |
| Radii | 6 checkbox · 8 small · 10 controls · 12 cards in panel · 14 page cards · 999 pills | |
| Shadows | menu `0 12px 32px rgba(11,27,52,.14)` · panel `-24px 0 48px rgba(11,27,52,.16)` · focus ring `0 0 0 3px rgba(47,107,255,.18)` | |

**Type:** Instrument Sans (self-hosted in `assets/fonts/`) for everything. h1 28/1.15/700 (−0.01em) ·
panel title 19/700 · card title 17/700 · section headings in panels 15/700 · body 14–15 · labels 13/600 · tags 11–12/600–700.
If the app already ships a different UI font, tell the product owner before swapping it — the design was drawn in Instrument Sans.

---

## 5. Layout

**Page:** content `max-width: 1280px`, centred, padding `32px 32px 48px`, vertical gap 24. Under the global header.

1. **Page head:** h1 "Board accounts" + one-line description (left), **New account** primary button 44px (right, bottom-aligned).
2. **Tabs:** underline tabs, gap 28, 15/600; active = ink text + 2px `--ba-primary` underline; the Accounts tab shows a count pill.
3. **Toolbar (Accounts tab):** filter chips left (36px pills, active = ink background, white text, count in `#C7CEDB`),
   search right (320px, 40px tall, magnifier icon, visually hidden label "Search accounts").
4. **Table card** (white, 1px border, radius 14, horizontal scroll under 880px):
   columns Person (auto) · Role 150 · Access 230 · Last sign-in 170 · actions 130 (right-aligned).
   Header row `--ba-surface-alt`, 13/600 `--ba-text-subtle`. Rows: padding `14px 20px`, 1px divider, hover `--ba-hover`.
   Person = 36px avatar (initials, tone colours) + name 15/600 (+ "You" / "Deactivated" grey tags) + email 13 muted.
   Access = "All sections" or "N of 15 sections" + outlined **Custom** tag. Actions = **Edit** (36px secondary) + **⋯** (36px square).
5. **Role permissions tab:** one card (radius 14). Top bar: title + one-line explanation (left), status text + Discard +
   **Save permissions** (right; both disabled at 45% opacity while there is nothing to save). Table: Section column +
   three 190px role columns, each header = role badge + "N of 15 sections" (Admin: lock icon + "All sections, always").
   Section rows 48px (15/600); sections with pages get a chevron button and "N pages"; expanded page rows 40px, indented,
   `--ba-surface-alt`. Cells: 20px checkbox in a 44×40 hit area; Admin cells = locked light-blue tick. Footnote row at the bottom.
6. **Side panels** (Edit account, New account): fixed overlay, scrim `--ba-scrim`, panel 600px wide (100% on narrow screens),
   full height, white, `--ba-shadow-panel`. Header (avatar + name + last sign-in, or title + subtitle; close ✕) ·
   scrolling body (padding 24, sections 32 apart) · sticky footer (status left; Cancel + primary right). Section headings 15/700.

The page has no dedicated phone layout in this design: below 880px the tables scroll horizontally and the panel becomes full width.

---

## 6. Components and states

| Component | States / rules |
|---|---|
| Filter chip | rest (white, `--ba-border`) · hover (border `#C3CBDA`) · active (`aria-pressed=true`, ink bg) · shows count per role |
| Search | filters by name or email as you type (case-insensitive); empty result → empty state with the query and a hint |
| Empty state | "No {role}s yet" + "Create one and pick the {role} role." + **New account** button; or "No account matches “q”" |
| ⋯ menu | 220px, radius 12, shadow; items 40px: Change password · Deactivate/Reactivate · divider · **Delete account…** (red). Own account: only Change password. Opens downward, or upward for the last two rows. Closes on outside click / Escape (focus back to ⋯) |
| Role badge | dot + label, colours per role (§4) |
| Custom tag | outlined blue pill; tooltip "This person has their own ticks instead of the role's" |
| Checkbox | 20px, radius 6; off = 1.5px `#8A93A6` border; on = blue fill + white tick; partly = blue fill + white dash. Native `<input type=checkbox>` stays in the DOM (transparent, on top) for keyboard/screen readers |
| Role card (radio) | 3 cards in a row; selected = 1.5px blue border, `#F5F8FF` fill, filled radio dot; caption "N of 15 sections by default" / "Every section" |
| Access tree | bordered list; section rows 46px with checkbox, name, "n/N" for sections with pages, chevron (36px) to show pages; page rows 40px indented on `--ba-surface-alt`. In Edit: changed leaf rows show **Added** / **Removed** tags vs. the role defaults |
| Access banner | Custom → blue box "Custom. Differs from the {role} defaults: 1 page more, 1 page less." + **Use {role} defaults** · default → grey box · Admin → green box, tree hidden |
| Security box (Edit) | rows: Password (Change password → inline new-password field + Generate + show/hide + Save password / Cancel), Deactivate/Reactivate, Delete account (Delete… → inline red confirmation naming the person: Keep account / **Delete account**). Own account: only Password |
| Footer status | "No changes yet" (grey) / "Unsaved changes" (blue); Save disabled until something changed |
| New-account validation | runs on **Create account** (always clickable); errors under each field in red, red border, `aria-invalid`; an error clears as soon as its field becomes valid; focus moves to the first invalid field |
| Created state | green check, "Account created for {name}", sign-in hint, **Create another** / **Back to accounts** |

---

## 7. Behaviour → API

The reference keeps everything in memory. Wire each action to the app's existing endpoints (find them in the codebase):

| Action | What happens in the UI | Backend |
|---|---|---|
| Open page | list + counts | list accounts (name, email, role, ticks or "follows role", last sign-in, deactivated) and role defaults |
| Edit → Save changes | panel closes, row updates (role, access, Custom tag), focus returns to that row's Edit | update account; send ticks only when they differ from the role defaults (else "follows role") |
| Change password → Save password | row shows "Password changed just now." | set password |
| Deactivate / Reactivate | immediate; grey "Deactivated" tag on the row; menu/panel label flips | deactivate / activate |
| Delete account → confirm | panel closes, row disappears, focus to **New account** | delete account |
| Create account | created state in the panel; new row at the end of the list | create account (name, email, password, role, ticks if custom) |
| Save permissions | status "Saved"; counts and Custom tags update everywhere | update role defaults |

Show the request state on the button that triggered it (disable it while pending); on failure keep the panel open,
keep what was typed, and show an inline error above the footer: "That didn’t save. Check your connection and try again."
(i18n key `saveFailed`). Closing a panel (✕, Cancel, scrim, Escape) discards unsaved edits.

---

## 8. Copy and languages

All UI strings are in `i18n/en.json` (as designed). `ro.json` and `de.json` are **drafts** with the same keys
(Romanian adds `_few` plural forms, i18next style) — merge them into the app's i18n and align the wording with the
terms the app already uses (e.g. what the app calls "Dispatcher" in RO/DE). **Section names are not in these files:**
use the app's existing translations for them. German uses the formal "Sie", like the login page.

---

## 9. Motion

| Element | Animation | Duration / easing |
|---|---|---|
| Side panel | slides in 40px from the right + fades | 320ms `cubic-bezier(.2,.8,.2,1)` |
| Scrim | fades in | 320ms ease |
| Chevrons | rotate (role table 0→90°, panel tree 0→180°) | 200ms ease |
| Hovers | background/border colour change | instant (as in the reference) |

Under `prefers-reduced-motion: reduce` all of the above are off. No other animation on this page.

---

## 10. Accessibility checklist

- Tabs are links with `aria-current="page"`; filter chips are toggle buttons (`aria-pressed`) in a labelled group.
- Every icon-only button has an `aria-label` ("More actions for {name}", "Close", "Show pages in {section}" …); ⋯ has `aria-haspopup="menu"` + `aria-expanded`; the menu uses `role="menu"` / `menuitem`.
- Table uses real `<table>`, `<th scope>`; role-table cells have labels like "Dispatcher: Weekly Reports / IADC Report".
- Panels: `role="dialog"`, `aria-modal`, labelled by the panel title; focus moves into the panel on open, **Tab is trapped**
  inside, **Escape** closes, focus returns to the control that opened it; page scroll is locked while open.
- Role cards are a `radiogroup` of real radios; ticks are real checkboxes; delete confirmation is `role="alertdialog"`.
- Status texts use `role="status"`. All targets ≥ 36px (row buttons) / 44px (cells, panel buttons). Text contrast ≥ 4.5:1.

---

## 11. Implementation notes

- Match the app's stack and component conventions; **copy values verbatim** from `app.js`/`app.css` (or map them to
  `tokens.css` variables). If the app uses Tailwind, put this page's styles in a plain CSS/CSS-module file rather than
  approximating with utility classes.
- In a component framework, render the panel as a portal with its own state; don't re-mount it on each change
  (the reference re-renders strings only because it has no framework).
- Keep demo query params (§12) in dev/test builds only, backed by fixture data matching `accounts` in `app.js`,
  so `screenshots.mjs` can capture your build. Never let them change real data.

---

## 12. Acceptance criteria and how to verify

Reference demo params: `view=roles` · `filter=Admin|Manager|Dispatcher` · `q=…` · `menu=<id>` ·
`expand=weekly,planning` · `dirty=1` (role table with 2 unsaved ticks) · `panel=edit&id=<ac|am|aa|cc|md|mu|ss>`
[`&role=Manager` · `&password=1` · `&confirm=1`] · `panel=new` [`&tried=1` · `&customize=1` · `&done=1&name=…&email=…`].

1. `node design/board-accounts/reference/screenshots.mjs /tmp/impl-shots http://localhost:<port>/<accounts-route>`
   produces the same 21 images as `design/board-accounts/screenshots/` (same names). Compare each pair visually and
   with a pixel diff (e.g. `pixelmatch`, threshold 0.1): only anti-aliasing may differ. (Needs `npm i -D playwright`.)
2. Manual: filter + search (incl. no match), ⋯ menu (own account shows only Change password; last rows open upward;
   Escape), Edit → change role → Custom banner/Added–Removed tags → Use defaults → Save; change password; deactivate;
   delete with confirmation; New account with empty submit → errors → fix → create; Role permissions tick → status →
   Discard / Save → list counts and Custom tags update; keyboard only (Tab trap, Escape, focus return); reduced motion.
3. No console errors; no layout shift when data loads (show the table skeleton/row heights from the start).

---

## 13. Decisions made / open questions for the product owner

- **Filled gaps (not drawn on the canvas, built in the same style):** inline "Change password" form inside the panel,
  the "Deactivated" tag and Reactivate, "These take effect right away." under Sign-in and account, the save-failure message.
- **Copy is English** as designed; RO/DE files are drafts for review.
- **Password on creation** is set by the admin and handed over in person (no invitation e-mail). Change if the app sends invites.
- **Closing a panel discards** unsaved edits without asking.
- **Example data:** which sections Alexandru, Antonio and Silviu have as Custom is invented for the demo.
