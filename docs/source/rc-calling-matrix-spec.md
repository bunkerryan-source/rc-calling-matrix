# Calling Matrix — Technical Spec

**Status:** Working prototype exists as a single-file React artifact. This spec describes the target production build.

**Owner:** William Ryan Bunker (Ryan), First Counselor, Rancho Carrillo Ward bishopric.

**Companion files:**
- `calling-matrix.jsx` — the current working artifact. Treat it as the reference implementation for UI structure, data shape, and interaction model (not for final styling). Port it into this spec's architecture.
- `design.md` — visual design system aligned with the Church's styling guide. Governs all aesthetic choices (colors, typography, spacing, component treatments). Overrides any styling details in the artifact or in this spec.

---

## 1. Purpose

A web dashboard for the Rancho Carrillo Ward bishopric to manage member callings. Replaces a read-only Excel spreadsheet (`RCW_-_Calling_Matrix.xlsx`) with an interactive, multi-user, versioned tool.

The core problem: restructuring callings is collaborative work. The bishopric wants to propose and iterate on changes together without corrupting the current "master" view of who is currently in which calling. Today, that happens in comment threads on a spreadsheet. This tool replaces that.

---

## 2. Users & Permissions

This is a multi-user, web-based application. Not a single-device tool.

### Permission model

**Flat collaboration.** Every authenticated user has the same permissions: view master, create drafts, edit drafts (drag-and-drop, Called, Sustained), toggle Set Apart on master, and **promote drafts to master**. The bishopric collaborates as peers — there is no per-user role hierarchy for this MVP.

There is no public sign-up. Accounts only exist because Ryan (acting as the app's Supabase admin) creates them. An "admin" in this app refers to the Supabase project owner, not an in-app role.

### Auth flow

1. **Admin provisions the account in Supabase.** Ryan creates a user via the Supabase dashboard (or the admin API) with the user's email and a temporary password. The user's `user_metadata` is set with `must_change_password: true`.
2. **User signs in** on the landing page using their email + temporary password.
3. **Forced password reset.** If `must_change_password` is true on the signed-in user, the app redirects to `/account/set-password` before granting access to any other route. The user sets a new password, and the flag is cleared.
4. **Landing page has a "Forgot password?" link** that triggers Supabase's standard password-reset email flow (`supabase.auth.resetPasswordForEmail`).

### Implementation notes

- Use `supabase.auth.signInWithPassword` — not magic links, not OAuth. Plain email + password.
- `/account/set-password` is the only authenticated route reachable while `must_change_password` is true. All other routes redirect there via middleware.
- After first login, users can change their password anytime from an account menu.
- Rate-limit the login endpoint (Supabase provides this by default; verify it's enabled).

### Security

Because all users share full permissions, RLS is simpler than a role-matrix model — every authenticated user with a row in `user_access` can read and write every application table. **Unauthenticated requests get nothing.** Write the RLS policies explicitly to enforce this; don't leave tables open.

---

## 3. Target Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | Matches Ryan's existing stack (net worth dashboard, FreightFlow CRM, recipes app) |
| Hosting | **Vercel** | Same |
| Database + Auth + Realtime | **Supabase** | Same. Ryan has Supabase MCP connected in Claude |
| UI | **React 18, Tailwind CSS v3, lucide-react icons** | Match the artifact |
| Fonts | Fraunces (display), DM Sans (body), JetBrains Mono (numerals) via Google Fonts | Match the artifact |
| Deploy convention | `main` branch → production, PR previews automatic | Vercel default |

Do **not** use Vite. Do **not** use an ORM (Prisma, Drizzle) unless it meaningfully simplifies things — prefer Supabase's `@supabase/supabase-js` client directly for the first pass.

---

## 4. Data Model

Schema lives in Supabase Postgres. All tables are RLS-protected. `ward_id` is included on root tables to keep the schema extensible to other wards later, even though the MVP serves only Rancho Carrillo Ward.

### Reference data

```sql
-- Wards (supports future multi-ward expansion)
create table wards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Members of a ward (all baptized members, not just those with callings)
create table people (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid references wards(id) on delete cascade,
  name text not null,
  slug text not null,  -- stable identifier, e.g. "ryan-bunker"
  created_at timestamptz default now(),
  unique (ward_id, slug)
);

-- Organizations (Bishopric, Elders Quorum, Primary, etc.)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid references wards(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  unique (ward_id, slug)
);

-- Callings within an organization (Bishop, President, Teacher, etc.)
create table callings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  title text not null,
  sort_order int not null default 0
);
```

### Master state (the current "in place" assignments)

```sql
-- Who currently holds each calling. Missing row = unfilled calling.
create table master_assignments (
  calling_id uuid primary key references callings(id) on delete cascade,
  person_id uuid references people(id) on delete restrict,
  set_apart boolean not null default false,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- A single row holding master-level metadata
create table master_meta (
  ward_id uuid primary key references wards(id) on delete cascade,
  last_promoted_at timestamptz,
  last_promoted_by uuid references auth.users(id),
  last_promoted_from_draft text
);
```

### Drafts (proposed changes)

```sql
create table drafts (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid references wards(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  based_on_master_at timestamptz not null,
  archived boolean not null default false
);

-- Per-draft assignments (full copy-on-write from master at creation)
create table draft_assignments (
  draft_id uuid references drafts(id) on delete cascade,
  calling_id uuid references callings(id) on delete cascade,
  person_id uuid references people(id) on delete restrict,
  called boolean not null default false,
  sustained boolean not null default false,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  primary key (draft_id, calling_id)
);

-- Staging: people who were displaced during editing and await reassignment
create table draft_staging (
  draft_id uuid references drafts(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (draft_id, person_id)
);
```

### Audit

```sql
-- Every promotion is recorded as a full snapshot for reference
create table promotion_history (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid references wards(id) on delete cascade,
  draft_name text not null,
  promoted_at timestamptz default now(),
  promoted_by uuid references auth.users(id),
  snapshot jsonb not null  -- full master state at time of promotion
);
```

### User access

```sql
-- Every authenticated user in this table has full permissions.
-- No row = no access (app rejects them at the middleware layer).
-- This table is populated manually by the Supabase admin as they provision accounts.
create table user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ward_id uuid references wards(id) on delete cascade,
  display_name text,
  granted_by uuid references auth.users(id),
  granted_at timestamptz default now()
);
```

### Seed data

The xlsx has been parsed. Seed data lives in the companion JSON. Use it to populate `organizations`, `callings`, `people`, `master_assignments`, and the set of members without callings. 23 organizations, 143 people, 13 without callings.

---

## 5. Features (from the artifact — preserve all of these)

### Master view
- Read-only display of every organization, every calling, and the person currently holding it.
- Each filled calling shows a **Set Apart** Y/N toggle. This is the *only* calling-level writable field on master — all other changes go through drafts.
- "Members Without a Calling" section at the bottom of the page with an **Add member** button on its header. Adding a member creates a new ward member record and immediately places them in this list. Removal/archival of members happens through the Admin page, not inline.
- Live stats in the header: total members, total assignments, total organizations.

### Draft view
- Copy-on-write snapshot of master when created. Named by the creator.
- Drag-and-drop person chips between callings. Also support tap-to-pickup + tap-to-drop as a mobile-friendly fallback.
- Dropping a person onto an occupied calling displaces the occupant into **Staging** (a transient rail at the top of the page in draft view only).
- Dropping a person into **Unassigned** removes their calling entirely.
- Each filled calling shows **Called** Y/N and **Sustained** Y/N toggles.
- **Changes from Master** panel sits directly below the Staging rail and above the organization grid, so reviewing the delta is the first thing a user sees while working. Lists every person whose assignments differ. Per person: "Was: [old]" → "Now: [new or Staging]" plus Called/Sustained for new assignments.
- Search/filter across people, calling titles, and organization names.
- Rename, discard, or promote the draft.

**Draft view vertical layout, top to bottom:** Header → Staging rail → Changes from Master panel → Organization grid → Members Without a Calling.

### Promotion
- Any authenticated user may promote a draft — the bishopric collaborates as peers. The `promoted_by` field records who did it for accountability.
- Replaces master assignments with the draft's assignments.
- Any members in Staging are moved to Unassigned.
- Set Apart status carries over only where the person in a given calling did not change. New assignments reset Set Apart to false.
- Called/Sustained are draft-only; they do not persist into master.
- A `promotion_history` row is written with the full snapshot.
- The UI should require a confirmation step before promoting — this is destructive to the current master.

### Sidebar filter (both views)

A persistent left sidebar menu lets users narrow the display to specific organizations (auxiliaries) or status filters. Applies to both master and draft views.

**Menu items** (in this vertical order):

1. **All** — show every organization and every member (default on load).
2. Each **organization** from the database comprising one or more rows from the database, in the same sort order used on the dashboard:
   - Bishopric
   - Clerks/Extended Bishopric
   - Young Men (comprising Deacons Quorum, Teachers Quorum and Priest Quorum)
   - Young Women (comprising Young Women 11-12, Young Women 13–14, and Young Women 15-18)
   - Sunday School
   - Relief Society
   - Elder's Quorum
   - Primary
   - Stake Callings
   - Misc (comprising Emergency Prep, Music, Employment, Single Adults, Ward History, Friendship Meal Coordination, Template Prep, Building Maintenance, and Ward Activities)
3. A visual divider, then two special filters:
   - **Set Apart** — shows only callings where a person is assigned but has not yet been marked Set Apart. Hides everything else. Master view only (this filter is meaningless in drafts since drafts don't edit Set Apart).
   - **No Calling** — shows only the "Members Without a Calling" list; hides all organization cards.

**Interaction model:**

- **Multi-select.** Users may click one or many menu items. Clicking an already-selected item deselects it.
- **All** is mutually exclusive with the other items: selecting All clears any other selections. Selecting any other item clears All.
- **Set Apart** and **No Calling** behave like additional filter toggles — if combined with organization selections, show organizations filtered to only their unset-apart callings; etc. Figure out the right combined semantics during implementation and surface any ambiguity for discussion.
- Selected items render with the sage accent on master, amber on draft (matching the existing visual language).
- Each menu item shows a count badge on the right (number of callings, or number of members for "No Calling") using JetBrains Mono.
- The sidebar must collapse to a top-drawer (hamburger menu) on narrow screens. This is an iPhone-usable app.

**Persistence:**

The user's sidebar selection persists per-session in `localStorage` (scoped per user). It does not need to sync across devices or users. Keep the filter state out of the URL for the MVP — add URL params later if someone asks for shareable filtered views.

**Layout impact:**

- On desktop: sidebar is ~220px, fixed to the left edge, scrolls independently from the main content.
- The existing main-area layout (header, org grid, changes panel, unassigned rail) shifts right to accommodate the sidebar.
- The search input in the header continues to work orthogonally to the sidebar — search filters within whatever the sidebar has already narrowed to.

### Visual design

A companion `design.md` accompanies this spec and governs all visual styling — colors, typography, spacing, component treatments, and iconography. It is aligned with The Church of Jesus Christ of Latter-day Saints' published styling guide so the app feels consistent with official Church materials the bishopric already uses.

Follow `design.md` for every styling decision. Where it conflicts with anything stated elsewhere in this spec or with the current artifact, `design.md` wins.

---

## 6. New features required for the multi-user build

The artifact was single-device. These are the capabilities that arrive with the Next.js + Supabase version.

### Authentication
- Supabase Auth with **email + password** only. No magic links, no OAuth providers.
- Accounts are provisioned by the Supabase admin (Ryan) — users do not sign themselves up.
- First login uses a temporary password set by the admin. The user is redirected to `/account/set-password` to set their own before reaching any other route.
- Landing page has a "Forgot password?" link that triggers Supabase's built-in password-reset email.
- Session persistence via Supabase cookies (use `@supabase/ssr`).
- A protected layout wrapping all application routes — unauthenticated users see the sign-in page only.

### Authorization & RLS
- Every authenticated user with a row in `user_access` has full read/write on all application tables. No per-user role gating.
- Write explicit RLS policies on every table: `select`, `insert`, `update`, `delete` all require `auth.uid() in (select user_id from user_access)`.
- Unauthenticated requests get nothing. Do not leave any table open.
- Client-side checks are UX, not security. The database is the boundary.

### Real-time collaboration
- Use Supabase Realtime to subscribe to changes on `master_assignments`, `drafts`, `draft_assignments`, and `draft_staging`.
- When another user moves a chip, toggles Set Apart, creates a draft, or promotes, every connected client updates within a second or two.
- Simple last-write-wins semantics are fine. Do not build operational transforms or CRDTs.
- Show a small "Also here: [avatars]" presence indicator in the header when more than one bishopric member is viewing the same draft.

### Admin
- A lightweight `/admin` page accessible to any authenticated user (since all users are peers) for:
  - Listing users in `user_access` and removing access (de-authorizing).
  - Add / edit / archive people, organizations, and callings. The seeded set will drift over time as members move in and out of the ward.
  - View `promotion_history`.
- Provisioning new users (creating accounts with temp passwords) happens in the Supabase dashboard, not in this app. If that friction becomes annoying, a future revision can add an in-app invite flow using the Supabase admin API.

### Deployment
- Vercel project connected to the GitHub repo.
- Two Supabase projects: `calling-matrix-dev` and `calling-matrix-prod`. Environment variables switch between them based on the Vercel environment.

---

## 7. Non-functional requirements

- **Performance:** This is 23 orgs × ~5–10 callings × 143 people. Trivial scale. No pagination or virtualization needed.
- **Mobile-friendly:** Every bishopric member uses an iPhone. The app must be fully usable on a phone screen. The current artifact is responsive but drag-and-drop on touch is marginal — the tap-to-move fallback is essential.
- **Offline:** Not required. The app assumes network.
- **Accessibility:** Basic semantic HTML, visible focus rings, sufficient color contrast. Do not ship drag-only interactions — every action must have a tap/click equivalent.
- **Privacy:** This data is internal to the bishopric. Do not index the app for search engines. Do not expose any API route without auth.

---

## 8. File & naming conventions

- Repository structure follows standard Next.js App Router layout (`app/`, `components/`, `lib/`, `supabase/`).
- File names use kebab-case (`org-card.tsx`, not `OrgCard.tsx`) except for Next.js-required names like `layout.tsx`, `page.tsx`.
- Git commits: short imperative subject, no emoji, no "chore:" prefixes.
- Database migrations live in `supabase/migrations/` named `YYYYMMDDHHMMSS_description.sql`.
- Markdown spec files and session notes: `YYYY-MM-DD-description.md`.

---

## 9. Implementation plan (suggested order for Claude Code)

Ryan will confirm or reorder these before kickoff. Steps listed in a reasonable default order.

1. **Scaffold.** New Next.js 14 App Router project with TypeScript, Tailwind, ESLint. Minimal dependencies.
2. **Supabase project.** Create dev project. Write all schema migrations. Seed from the artifact's embedded JSON. Add RLS policies.
3. **Auth.** Email + password sign-in page. Protected layout via middleware. `/account/set-password` route with forced redirect when `must_change_password` is true. "Forgot password?" link wired to `resetPasswordForEmail`. Session handling via `@supabase/ssr`.
4. **Master view (read-only).** Render the same layout as the artifact, populated from the database. No edits yet.
5. **Sidebar filter.** Build the left-sidebar menu with All, per-organization rows, and the Set Apart / No Calling filters. Hook it up to client-side state that narrows the org grid. Mobile drawer variant.
6. **Set Apart toggle on master.** First writable field. Validates the update pattern end-to-end.
7. **Add member.** "Add member" button on the Members Without a Calling header opens a modal taking a name. Creates a row in `people`, immediately reflected in the master view. Simple; no phone/email/household fields for MVP.
8. **Drafts: create / list / rename / delete / switch between.** No editing yet.
9. **Draft editing: drag-and-drop + tap-to-move.** Port the artifact's logic. Wire to `draft_assignments` and `draft_staging`. New members added after a draft was created appear automatically in that draft's Members Without a Calling.
10. **Called / Sustained toggles in draft view.**
11. **Changes from Master panel.** Port directly from the artifact.
12. **Promote.** Transaction that writes new `master_assignments`, preserves Set Apart where appropriate, archives the draft, writes `promotion_history`. Confirmation dialog before executing.
13. **Realtime subscriptions.** Wire live updates on all four mutable tables.
14. **Presence indicator.** "Also here" avatars in the header.
15. **Admin page.** User list, de-authorize action, people/orgs/callings CRUD (including archiving members who leave the ward), promotion history viewer.
16. **Polish + deploy to Vercel.** Production Supabase project, env vars, custom domain if desired.

Each step should be a PR reviewable in isolation.

---

## 10. Decisions already made (do not re-litigate)

- Master + draft model is correct. One master, many drafts, drafts copy-on-write.
- Status colors from the original spreadsheet (yellow / cyan / white) were stripped intentionally. Do not bring them back.
- No import/export of Excel/CSV. The xlsx was a one-time seed. Drift is handled through the admin UI.
- Visual styling is governed by the companion `design.md` (aligned with the Church's styling guide). Do not substitute a different aesthetic.
- **Called / Sustained do not persist into master.** They are draft-only bookkeeping. Once promoted, only the Set Apart Y/N matters on master. Do not write Called/Sustained into `promotion_history`.
- **No notifications.** Email, push, in-app — none of it. Out of scope.
- **Single ward only.** No ward selector. If the schema carries `ward_id` for optionality, that is fine, but do not build any multi-ward UI.
- **Source data correctness is Ryan's responsibility.** He will fix spreadsheet typos before the xlsx is handed to Claude Code. Don't second-guess names in the seed.
- **Sidebar combined-filter semantics.** When a user selects an organization *and* the Set Apart filter, show that organization filtered to only its unset-apart callings. Intersection semantics, not union.

---

## 11. Open decisions for Claude Code to surface

1. **Implementation plan order.** Section 9 provides a suggested sequence, but Ryan will confirm or reorder the steps at launch. Do not begin implementation before he has signed off on the order.
   1. Ryan's Response:  This order is: Bishopric, Clerks / Extended Bishopric, Deacons Quorum, Teachers Quorum, Priest Quorum, Young Women 11-12, Young Women 13-14, Young Women 15-18, Sunday School, Relief Society, Elder's Quorum, Primary, then everything else with Stake Callings being last.


---

## 12. About Ryan

Ryan is an attorney by training — UCLA Law, practicing for years, now Chief Legal Officer at a family office. He is comfortable directing technical work but does **not** write code himself. He can read code at a high level and reason about architecture, data models, and tradeoffs. He cannot run terminal commands beyond what is explicitly handed to him.

Practical implications for Claude Code:
- Explain changes in plain English alongside the code.
- Do not ask him to debug locally — run everything from Claude Code's environment.
- When a decision is ambiguous, **surface the decision as a question**. Do not pick silently.
- He values spec-first development and clean architecture. Cutting corners to ship faster is usually not what he wants.
- He dislikes AI slop — cliché framing, hedging, over-explanation, unnecessary qualifiers. Write like a competent senior engineer explaining work to a peer.
