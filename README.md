# Gasa Admin Platform

The platform-operator SPA for the GASA marketplace. Talks to the same
separate Laravel REST API as the other portals at `VITE_API_URL`, all routes
under `/api/v1`.

**Role: Platform Admin.** GASA is the owner and operator — it runs the
marketplace, onboards every organization, and sees every transaction: the
neutral bookkeeper between all parties. This portal is inherently
marketplace-wide; it has no tenant scope and nothing to switch between.

## Where this sits

Per the system architecture, each role gets its own UI against one shared
backend:

```
Company UI ─┐                        ┌─ Merchant UI
Employee UI ─┼─> API / Backend <─────┤
             │   Auth / RBAC         └─ Platform Admin UI  (this repo)
             │   Companies / Employees
             │   Merchants / Payments
             └─> Central DB (PostgreSQL)
```

Sibling repo: `../merchant-platform` (the merchant UI). This app deliberately
mirrors its architecture — same stack, same API-client contract, same auth
shape — so a change to a shared convention is recognizable in both. Where
this app differs, the difference is documented below and in the relevant
file's docstring.

## Stack

- React 18 + Vite + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (Radix primitives, `class-variance-authority`)
- Inter (UI) / JetBrains Mono (data) via `@fontsource-variable`, Tabler +
  Lucide icons
- React Router
- TanStack Query for **all** server state — no server data in `useState`
- Vitest + React Testing Library

## Getting started

```sh
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
npm run mock-api     # in a second terminal — see "Offline dev" below
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`,
`npm run test`, `npm run typecheck`.

> **Port note:** this app and the merchant portal both default to Vite's
> 5173. Run only one at a time, or start the second with `--port`.

## Status

**Auth + shell scaffold.** What is real: the whole authentication and
routing layer (login, boot, session expiry, logout, the platform-admin role
gate) plus the sidebar app shell. Every content section — Companies,
Merchants, Transactions, Redemptions, and the dashboard's stat tiles — is a
`PlaceholderPage`.

The screens stayed placeholders because no backend contract existed for
them. **That is no longer true for merchants.** The API repo (`../gasa-api`)
now publishes an admin route group — note the prefix is `/admin/*`, not the
`/platform/*` this README previously anticipated:

| Route | Purpose |
| --- | --- |
| `GET /admin/merchants` | List, filterable by `status`/`search`, `per_page` ≤ 100 |
| `POST /admin/merchants` | Provision a merchant |
| `GET /admin/merchants/{merchant}` | Detail + team + status history |
| `PATCH /admin/merchants/{merchant}/status` | Approve / suspend / reinstate |
| `POST /admin/merchants/{merchant}/resend-invite` | Re-send the owner invite |
| `GET /admin/audit-logs` | The audit trail |

All of it sits behind `auth:sanctum` + `role:platform_admin` +
`AllowsAdminContext` (see `gasa-api/bootstrap/app.php`). Companies,
Transactions and Redemptions still have no published contract.

### Next step for whoever picks this up

1. Document the `/admin/merchants` request/response shapes in this README
   (follow the merchant portal's README, which records list/detail shapes,
   money fields, and pagination meta). The source of truth is
   `AdminMerchantListResource` / `AdminMerchantDetailResource`.
2. Extend `scripts/mock-api.mjs` in the same change.
3. Then replace the Merchants placeholder — one feature folder, following
   `../merchant-platform/src/features/orders/` as the reference for
   `types.ts` / `api.ts` / `use-*.ts` / `pages/`.
4. The `table`, `pagination`, `select`, `badge`, `dialog` and
   `dropdown-menu` primitives that screen needs were removed as unused (see
   "UI conventions"); regenerate them with
   `npx shadcn add table pagination select badge dialog dropdown-menu`.

## Routes

| Path | Page | Status |
| --- | --- | --- |
| `/login` | `LoginPage` | Real |
| `/no-access` | `NoAccessPage` | Real |
| `/app/dashboard` | `DashboardPage` | `useMe` identity line + placeholder |
| `/app/companies` | `CompaniesPage` | `PlaceholderPage` |
| `/app/merchants` | `MerchantsPage` | `PlaceholderPage` |
| `/app/transactions` | `TransactionsPage` | `PlaceholderPage` |
| `/app/redemptions` | `RedemptionsPage` | `PlaceholderPage` |

`/app` index-redirects to `/app/dashboard`. The sidebar groups these as
Overview / Organizations / Ledger, matching how the operator role actually
splits: who is on the marketplace, and what moved through it.

## API error shape

Every non-2xx response from the backend has the shape:

```ts
{ message: string; code?: string; errors?: Record<string, string[]> }
```

- `422` — validation failure; `errors` maps field name to messages.
- `401` — invalid or expired token.
- `403` with `code: "portal_forbidden"` — the account can't use this portal.
- `429` with `code: "too_many_attempts"` — login throttled.

`src/lib/api/client.ts` normalizes all of this (including network failures)
into a typed `ApiError { status, message, code, errors }`.
`registerOnUnauthorized(cb)` is wired once, in `src/features/auth/session.ts`,
to react to any 401 globally; `registerTokenGetter(fn)` is wired once, in
`src/features/auth/store.ts`, to supply the bearer token. A per-request
`suppressUnauthorized` option opts a call out of that global handler for a
401 that's an expected, in-band outcome rather than an expired session —
login and logout use it.

**Difference from the merchant portal:** that app's client also carries a
`registerOnMerchantInactive` hook for a 403 `merchant_inactive` (a tenant
suspended mid-session). This client deliberately omits it. The platform
admin operates the marketplace rather than belonging to it, so there is no
tenant that can be suspended out from under the session, and the hook would
be permanently dead code.

## Auth

All auth state lives in `src/features/auth/store.ts` (zustand): `status`
(`"booting" | "guest" | "authed"`), `token`, and `user`. Only the token is
persisted (`localStorage`, one namespaced key) — `user` is never persisted,
since **roles could go stale**, and is always rehydrated from `GET /auth/me`.
That matters more here than in the merchant portal: the role is what gates
the entire app.

- **Portal discriminator** — login posts `portal: "platform"` alongside the
  credentials (`api.ts`), which is what lets the backend reject a merchant
  or company account with `403 portal_forbidden`. There's a test asserting
  this at the `fetch` boundary, since the field is added inside `api.ts`
  where a spy on `login()` wouldn't see it.
- **Boot** (`use-auth-boot.ts`): a stored token is confirmed against
  `/auth/me` before the user is treated as authed. `app/providers.tsx`
  renders a full-screen loader for the whole app while `status === "booting"`,
  so a refresh on an authed session never flashes `/login`.
- **Guard** (`require-auth.tsx`): redirects guests to `/login`, preserving
  the attempted location for post-login redirect.
- **Session expiry** (`session.ts`): any un-suppressed 401, anywhere, clears
  the store, clears the TanStack Query cache, and redirects to `/login` with
  a "session expired" notice — idempotently, so two 401s in flight at once
  only trigger it once.
- **Logout** (`use-logout.ts`): clears store/cache and redirects to `/login`
  regardless of whether the `/auth/logout` call itself succeeds.
- **Live protected query** (`use-me.ts`): the dashboard calls `GET /auth/me`
  once via TanStack Query (`staleTime: Infinity`, no polling). Beyond
  fetching the name, this is what makes a server-side token revocation show
  up as a real session-expiry while the user is actively on the dashboard,
  not only at boot/refresh.

### Role gate

Where the merchant portal asks *"is this tenant suspended?"*
(`RequireActiveMerchant` → `/suspended`), this app asks *"does this account
hold the operator role?"*:

- `selectIsPlatformAdmin` (`store.ts`) is the single source of truth both
  routes below read, so they can never disagree about who belongs inside
  `/app`. It fails closed — a payload with no `roles` field returns `false`
  rather than throwing inside a render-time guard.
- **`require-platform-admin.tsx`** wraps `/app`: guest → `/login` (via
  `RequireAuth`), authed-but-not-an-admin → `/no-access`.
- **`no-access-page.tsx`** (`/no-access`): a calm, no-shell page explaining
  the account isn't an operator account and pointing at the right portal —
  the cause is a wrong account, not a problem to fix, so the copy doesn't
  imply one. Self-guards the other two directions (guest → `/login`,
  admin → `/app`).

> This is a **UI guard, not a security boundary.** It decides what to render.
> The backend must independently authorize every `/platform/*` request — a
> forged `roles` array in a client-side store must never be what stands
> between a support account and marketplace-wide financial data.

### localStorage namespacing

Both the token (`gasa_admin_auth_token`) and the theme
(`gasa-admin-theme`) use keys distinct from the merchant portal's
(`gasa_merchant_auth_token` / `gasa-theme`). Different localhost ports are
already separate origins, so this isn't about dev — it's for a deploy where
both portals sit on one domain and would otherwise share, and clobber, a
single key. A test asserts the token keys don't collide.

## Offline dev: mock API

`npm run mock-api` runs `scripts/mock-api.mjs`, a minimal Node server on
`:8010` (matching `.env.example`) implementing the auth contract above, for
developing against when the real backend isn't running.

Seeded users (password `password` for all three):

| Email | Exercises |
| --- | --- |
| `admin@gasa.test` | The happy path — a real platform admin |
| `staff@gasa.test` | Authenticates, but lacks `platform_admin` → `/no-access` |
| `merchant@gasa.test` | Wrong portal → `403 portal_forbidden` on the login form |

Two dev-only escape hatches, not part of the real API: `POST /__revoke`
`{token}` simulates a server-side revocation (to exercise session expiry
while the SPA still holds the token), and `POST /__reset-attempts` clears the
login throttle.

It contains **only the `/auth/*` routes**. The API's admin group
(`/admin/merchants`, `/admin/audit-logs` — see "Status") is real but not
mocked here yet; add it in the same change that starts consuming it.

**Sync rule:** any backend contract change (new field, changed status code,
new error code) must update `scripts/mock-api.mjs` in the same change that
starts relying on it in the frontend. A mock that quietly drifts from the
real API is worse than no mock — it makes `npm run dev` lie about what
works. If a contract change lands and nobody has time to update the mock,
delete the mock rather than leave it stale.

## UI conventions

shadcn/ui: Tailwind v4 + Radix primitives generated into
`src/components/ui/` and customized in place rather than imported from a
package.

**Only primitives actually in use are kept.** The generated set is not a
vendored library to carry around — an unused component is code that gets
linted, typechecked and read by the next person for no reason. Twelve
unreferenced ones (`alert`, `alert-dialog`, `badge`, `card`, `collapsible`,
`dialog`, `dropdown-menu`, `field`, `pagination`, `select`, `table`, `tabs`)
were removed for that reason. Regenerate any of them on demand with
`npx shadcn add <name>` — which also picks up the current registry rather
than preserving a stale local copy.

`cn` comes from the `cn` package directly (`import { cn } from "cn"`), not
from a local `lib/utils` re-export; `components.json`'s `utils` alias points
at it so newly generated components match.

### Visual language: operator console, not storefront

This app looks deliberately unlike the merchant portal. That portal is a
tenant-facing product and is themed as one — warm orange, pill buttons, a
split login card with a product screenshot. This is internal tooling for
GASA staff, so it is themed as an instrument:

- **Cool slate palette, no brand hue.** The neutral is biased slightly blue
  (hue ~258) rather than flat grey. `primary` is one restrained slate-blue,
  spent only on focus rings, the active nav item, and primary buttons.
- **Semantic color is separate from the accent.** `success` / `warning` /
  `destructive` are not derived from `primary` — in a console, status must
  never be mistaken for emphasis.
- **Square-edged.** `--radius` is `0.3rem`. Two stock-preset overrides,
  each noted in its own file: `button.tsx` drops the `rounded-4xl` pill, and
  `input.tsx` replaces a borderless `rounded-3xl` fill with a real hairline
  edge, inset shadow, hover state and focus ring — a field with no border
  has no defined edge and reads unfinished on a data-entry surface.
- **Near-ink primary**, not a mid-blue. The button is a considered dark
  surface in light theme and inverts to near-white on ink in dark.
- **Mono micro-labels.** The `console-label` utility (mono, uppercase,
  letter-spaced) carries field labels and eyebrows. `tabular-nums` is on by
  default, since IDs, counts and amounts line up in columns constantly.
- **No `brand-gradient` utility**, unlike the merchant portal — a
  decorative gradient reads as storefront. Hierarchy comes from hairlines,
  type weight, and one accent.
- Colors go through the shadcn CSS variables (`--primary`,
  `--muted-foreground`, `--sidebar`, …) — no raw hex in components.
- Light theme is the default (`:root`); dark is the `.dark` class, applied
  pre-paint by an inline script in `index.html` and persisted via
  `src/lib/theme.ts`. Both themes are designed, not inverted.
- File names are kebab-case, enforced by `eslint-plugin-check-file`.

### Stylesheets: where a screen's CSS lives

`src/index.css` is the app-wide layer only — tokens, both themes, base
element styles, and utilities used across screens (`console-label`). A
treatment belonging to one screen lives with that screen; the login page's
is `src/features/auth/login.css`.

> **Import screen stylesheets from `src/index.css`, never from a component.**
> `@utility` is a Tailwind at-rule, and Tailwind only expands it inside the
> stylesheet it processes as an entry point. A CSS file imported from a
> `.tsx` module is handled by Vite as a plain asset instead: its `@utility`
> blocks are concatenated into the bundle as inert `@utility …` text, the
> classes never become real rules, and **the build still succeeds** — the
> page just renders unstyled. Plain selectors (`.dark .vault-plate`) survive
> that path, so a partial failure looks like a puzzling half-styled screen
> rather than an obvious break.

### Login

"The vault": a framed plate rather than a floating card. An outer hairline
frame with corner ticks holds a plate at arm's length, and that gap is the
device — a card sits *on* a page, a framed plate is *mounted* in one. The
ground is three non-repeating washes (deliberately not graph paper, which is
what makes a background read as stock). Premium here is proportion and type,
not ornament: no gradient behind the form, no glass, no brand hue.

Split across four files, each with one job:

| File | Holds |
| --- | --- |
| `pages/login-page.tsx` | Form behaviour and layout |
| `components/login-field.tsx` | The field control (standalone, not the shadcn `field`) |
| `login-error-message.ts` | `ApiError` → user-facing copy, one table |
| `login.css` | The vault treatment (imported from `index.css` — see above) |

Each field puts its label above the input and its error on the same row to
the right, so the field height never changes between valid and invalid
states and the form doesn't jump when validation runs.

The refinement is in the details rather than in added elements: a small
tracked-out "GASA" over a tight-tracked heading, a considered type scale
(13px UI text against a 24px heading), even spacing, and a hairline rule
giving the fine print a base. The inputs get their quality from the
`input.tsx` override described above.

**No brand mark is used yet, by request.** When one is chosen it goes above
the "GASA" line; the header block is already spaced for it. The candidates
live in `../gasa-brand/`.

Each field puts its label above the input and its error on the same row to
the right, so the field height never changes between valid and invalid
states and the form doesn't jump when validation runs.

## CI

`.github/workflows/ci.yml` runs on every PR into `main` and every push to
`main`: lint, typecheck, and test run in parallel, then build runs after all
three pass and uploads `dist/` as a workflow artifact. No CD yet — deploy
target is still undecided.
