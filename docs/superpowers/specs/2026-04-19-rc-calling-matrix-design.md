# Rancho Carrillo Calling Matrix — Design

**Date:** 2026-04-19
**Owner:** W. Ryan Bunker (Ryan), First Counselor, Rancho Carrillo Ward bishopric
**Status:** Design approved; pending implementation plan

This document is the authoritative design for the Rancho Carrillo Ward Calling Matrix web app. It consolidates `rc-calling-matrix-spec.md` (technical spec), `rc-calling-matrix-design.md` (visual system), and decisions made during brainstorming on 2026-04-19.

Where this document conflicts with the source spec or the JSX artifact, this document wins.

---

## 1. Purpose

A multi-user, web-based dashboard for the Rancho Carrillo Ward bishopric to manage member callings. Replaces a read-only Excel spreadsheet (`RCW_-_Calling_Matrix.xlsx`) with an interactive, versioned, collaboratively-edited tool.

The core problem: restructuring callings is collaborative work, and the bishopric needs to propose and iterate on changes together without corrupting the "master" view of who currently holds which calling. Today that happens in comment threads on a spreadsheet. This tool replaces that with a master/draft model and a promote action that atomically replaces master from a draft.

---

## 2. Users & Permissions

**Flat collaboration model.** Every authenticated user has identical permissions:
- View master
- Toggle `set_apart` on master
- Create, edit, rename, archive, delete drafts
- Promote any draft
- Add / archive / edit people, organizations, and callings via `/admin`
- Remove other users' access

There is **no** role hierarchy. "Admin" in this document refers to the Supabase project owner (Ryan), not an in-app role. Provisioning of new user accounts happens through the Supabase dashboard, not in the app.

**Access gate:** authentication + a row in `user_access`. No row, no access. Unauthenticated requests get nothing.

---

## 3. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ App Router, TypeScript (strict) |
| Runtime / package manager | Node 20 LTS, npm |
| Styling | Tailwind CSS v3 |
| Icons | lucide-react |
| Database + Auth + Realtime | Supabase (Postgres 15+) |
| Data client | `@supabase/supabase-js`, `@supabase/ssr` (cookie session) |
| ORM | None — use `supabase-js` directly |
| Hosting | Vercel (`main` → prod, branches → preview) |
| Deploy URL | `rc-calling-matrix.vercel.app` (default Vercel subdomain) |

**Supabase environments:** `calling-matrix-dev` and `calling-matrix-prod`. Environment variables switch between them based on Vercel environment.

**Prohibited:** Vite. ORMs (Prisma/Drizzle) unless a later clear need justifies adoption.

---

## 4. Visual System

Governed by `rc-calling-matrix-design.md` (Church visual guide alignment). The app leans informal-warm per the guide's formality rubric — this is a local, internal tool for a local leadership council, not sacred or official material.

### Typography

| Use | Font | Fallback stack |
|---|---|---|
| Headings | Source Serif Pro (McKay Pro substitute) | `'Source Serif Pro', Georgia, serif` |
| Body / UI | Inter (Zoram substitute) | `Inter, 'Helvetica Neue', system-ui, sans-serif` |
| Numerals, counts, timestamps | JetBrains Mono | `'JetBrains Mono', ui-monospace, monospace` |

All loaded via `next/font/google`.

### Color

| Token | Hex | Usage |
|---|---|---|
| Primary Blue | `#005175` | Master-mode accent: headings, primary buttons, Set Apart active, stats, sidebar selection on master |
| Amber (draft accent) | `#C4871F` | Draft-mode accent: selection, toggles, sidebar selection, "draft mode" indicator |
| Black | `#000000` | Body text |
| Surface warm-white | `#FAF8F4` | Card backgrounds, panels |
| White | `#FFFFFF` | Page background |
| Sage neutral | `#A8B5A3` | Person-chip avatar seeding (one of several palette entries — see below) |

**Avatar-chip palette** (name-hashed, color-seeded):
`#D4C5A2, #C9B99F, #B5A58B, #A89C8E, #8FA58E, #9BAE94, #B5B098, #C4B79E, #D8B59A, #C9A58E, #B8967F, #A68270`

Lifted from the artifact; these are earth tones that play well on the warm-white surface.

### Master vs Draft visual distinction

The single most important visual signal in the app is "am I editing the real thing?" To preserve this:

- **Master mode** uses Primary Blue `#005175` as the accent color for selections, active toggles, and stats.
- **Draft mode** uses Amber `#C4871F` as the accent color. The `/drafts/[id]` route layout tints the header strip and the sidebar selection amber.

This is a deliberate divergence from `rc-calling-matrix-design.md`'s single-accent rule. Rationale: user-safety against accidental master edits outweighs strict palette adherence for a local internal tool.

### Do not use

- The official Church symbol, wordmark, Christus arch, or cornerstone shape (per Handbook 38.8.8).
- The artifact's original Fraunces / DM Sans typefaces (superseded by design.md).
- The original spreadsheet's status colors (yellow / cyan / white).

### Responsive

Mobile-first. At `<768px`, the sidebar collapses to a top drawer (hamburger menu). Every drag-and-drop interaction has a tap-to-move fallback. Visible focus rings; ≥50% luminance contrast for all text.

---

## 5. Data Model

Schema lives in Supabase Postgres. All tables are RLS-protected. `ward_id` is retained on root tables for future multi-ward extensibility but no multi-ward UI is built.

### 5.1 Reference tables

```sql
create table wards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table people (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references wards(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz default now(),
  unique (ward_id, slug)
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references wards(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  unique (ward_id, slug)
);

create table callings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  sort_order int not null default 0
);
```

### 5.2 Master state

```sql
create table master_assignments (
  calling_id uuid primary key references callings(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  set_apart boolean not null default false,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

create table master_meta (
  ward_id uuid primary key references wards(id) on delete cascade,
  last_promoted_at timestamptz,
  last_promoted_by uuid references auth.users(id),
  last_promoted_from_draft text
);
```

Absence of a row in `master_assignments` for a given `calling_id` means the calling is unfilled.

### 5.3 Drafts

```sql
create table drafts (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references wards(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  based_on_master_at timestamptz not null,
  archived boolean not null default false
);

create table draft_assignments (
  draft_id uuid references drafts(id) on delete cascade,
  calling_id uuid references callings(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  called boolean not null default false,
  sustained boolean not null default false,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  primary key (draft_id, calling_id)
);

create table draft_staging (
  draft_id uuid references drafts(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (draft_id, person_id)
);
```

### 5.4 Audit

```sql
create table promotion_history (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references wards(id) on delete cascade,
  draft_name text not null,
  promoted_at timestamptz default now(),
  promoted_by uuid references auth.users(id),
  snapshot jsonb not null
);
```

`snapshot` captures the full post-promotion master state, including person names (not just IDs), so it remains human-readable even if people are later hard-deleted.

### 5.5 Access control

```sql
create table user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ward_id uuid not null references wards(id) on delete cascade,
  display_name text,
  granted_by uuid references auth.users(id),
  granted_at timestamptz default now()
);
```

### 5.6 Foreign-key delete behavior

Hard-delete semantics are chosen for people. When a person is deleted through `/admin`:

| Table | Behavior | Effect |
|---|---|---|
| `master_assignments` | `ON DELETE CASCADE` | The calling becomes unfilled (no row) |
| `draft_assignments` | `ON DELETE CASCADE` | The calling becomes unfilled in that draft |
| `draft_staging` | `ON DELETE CASCADE` | Person removed from staging |
| `promotion_history.snapshot` | No FK (jsonb) | Name preserved in historical snapshot |

No `archived` column on `people`. Restoring an accidentally-deleted person means recreating them through `/admin`.

### 5.7 RLS

Write explicit policies on every table. Every policy for `select`, `insert`, `update`, `delete` requires:

```sql
auth.uid() in (select user_id from user_access)
```

No anon reads. No open tables. Client-side checks are UX only; the database is the boundary.

### 5.8 Seed

Seed data lifted from `INITIAL_DATA` in `rc-calling-matrix.jsx` and translated into a Supabase seed migration. 23 organizations, 143 people, 13 without callings. The xlsx is not parsed; the JSX already contains the cleaned-up data.

**Organization sort order** (per Ryan's explicit answer in the spec, Section 11):

1. Bishopric
2. Clerks / Extended Bishopric
3. Deacons Quorum
4. Teachers Quorum
5. Priests Quorum
6. Young Women 11-12
7. Young Women 13-14
8. Young Women 15-18
9. Sunday School
10. Relief Society
11. Elders Quorum
12. Primary
13. Remaining auxiliaries (Emergency Prep, Music, Employment, Single Adults, Ward History, Friendship Meal Coordination, Temple Prep, Building/Maintenance, Ward Activities, Young Women [umbrella])
14. Stake Callings (last)

---

## 6. Authentication

### 6.1 Flow

1. **Sign-in** at `/sign-in` via `supabase.auth.signInWithPassword` (email + password). No magic links, no OAuth.
2. **First-login gate:** middleware checks the signed-in user's `user_metadata.must_change_password`. If `true`, all routes except `/account/set-password` redirect there.
3. **Set password:** `/account/set-password` writes the new password and clears the flag.
4. **Password reset:** the sign-in page displays "Forgot password? Contact the admin." Ryan resets passwords manually via the Supabase dashboard and hands out new temp passwords. No email reset flow in MVP.

### 6.2 Session

Cookie-based via `@supabase/ssr`. Persisted across tabs and devices. Sign-out clears the cookie.

### 6.3 First user provisioning

Ryan's account is created via the Supabase MCP during initial setup with `must_change_password: false` and a password Ryan provides inline during setup. All subsequent users go through the standard temp-password flow created in the Supabase dashboard.

### 6.4 Middleware

Next.js middleware on every route except `/sign-in` and the Next.js static asset paths:

1. If no session → redirect to `/sign-in`.
2. If session but no `user_access` row → sign-out and redirect to `/sign-in` with an error.
3. If session + `user_access` but `must_change_password` → redirect to `/account/set-password` (except when already there).
4. Otherwise pass through.

---

## 7. UI Surfaces

### 7.1 `/` — Master view

**Header:**
- Left: title ("Calling Matrix — Rancho Carrillo Ward") in Source Serif Pro.
- Center: stats row in JetBrains Mono — total members, total assignments, total organizations.
- Right: search input, presence badge ("N members here" when >1), account menu.

**Left sidebar filter** (desktop ≥768px; collapses to hamburger top-drawer on mobile):
- "All" (default)
- Each organization in the order from §5.8, with count badge
- Divider
- "Set Apart" filter (master only — shows callings where a person is assigned but `set_apart = false`)
- "No Calling" filter (shows only the members-without-a-calling list)
- Multi-select. "All" is mutually exclusive with everything else. Intersection semantics when combined with org selections (e.g., "Elders + Set Apart" = Elders callings where Set Apart is false).
- Selection persisted in `localStorage` scoped per `user_id`.

**Main:**
- Organization cards in a responsive grid. Each card lists callings in the order from the seed. Each filled calling renders the person chip + title + a `Set Apart` toggle.
- `Set Apart` toggle is the only writable field on master. All other changes require a draft.
- Below the grid: "Members Without a Calling" section with an **Add Member** button in its header.

**Add Member modal:** Name only. On submit, creates a `people` row with a generated slug (kebab-case; append `-2`, `-3` on collision) and inserts them into the unassigned pool.

### 7.2 `/drafts` — Drafts list

- Lists non-archived drafts by `created_at desc`. Each card shows name, creator, created date, button to open.
- "Create new draft" button — opens a modal taking a draft name; on submit, a `create_draft(name text)` RPC snapshots current `master_assignments` into `draft_assignments` and inserts the `drafts` row in a single transaction so partial drafts can never exist.
- "Show archived" toggle reveals promoted drafts (read-only badge "Promoted on [date]").
- Rename / delete via per-card menu.

### 7.3 `/drafts/[id]` — Draft view

**Vertical layout, top to bottom:**
1. Header (with an unmistakable amber band and "DRAFT: [name]" label)
2. Staging rail — chips of displaced people awaiting reassignment
3. Changes-from-Master panel — lists every person whose assignment differs. Per person: "Was: [old calling]" → "Now: [new calling or Staging]" plus Called/Sustained for new assignments
4. Organization grid — same card layout as master, but:
   - Chips are draggable (pointer + touch)
   - Dropping onto an occupied calling displaces the occupant into Staging
   - Dropping into Unassigned clears the calling
   - Each filled calling shows Called / Sustained toggles
5. Members Without a Calling section

**Drag UX:** optimistic — chip moves instantly on drop, writes happen in the background. A single drop fans out to at most three DB operations (upsert the new draft assignment, delete the displaced one if any, insert a draft_staging row if displacement occurred), issued in parallel from the client. On any failure, revert the UI and toast. Supabase Realtime subscriptions reconcile conflicting writes from other users. Promotion is the only server-side RPC (§8.2); individual drag moves don't need one.

**Search input:** filters within whatever the sidebar has already narrowed to.

### 7.4 `/account/set-password`

Single form. Requires new password (twice). On submit, calls `supabase.auth.updateUser`, clears `must_change_password`, redirects to `/`.

### 7.5 `/sign-in`

Email + password form. "Forgot password? Contact the admin." text below the submit button. No reset flow.

### 7.6 `/admin` — Tabbed single page

Tabs (client-side switching):

1. **Users** — list rows from `user_access` joined with `auth.users` for email. "Remove access" button per row (deletes from `user_access`; does not delete the auth user). Note at top: "To invite a new user, create them in the Supabase dashboard, then add them here."
2. **People** — list, edit (name), hard-delete (with confirmation listing the cascade consequences: "This will remove X from their current calling(s) and [Y draft assignments]"). "Add person" button (same modal as the Master view).
3. **Organizations & Callings** — nested list. Add/edit/delete orgs. Add/edit/delete callings within each org. Reordering via drag-handle (updates `sort_order`).
4. **Promotion History** — list of `promotion_history` rows by `promoted_at desc`. Click a row to view the snapshot as a read-only rendered view (not JSON).

---

## 8. Promotion

### 8.1 UX

- "Promote" button in the draft header.
- Click opens a modal:
  - Headline: "Replace master with [N] changes?"
  - Body: diff table — every changed calling. Each row: `Was: [old person or Unfilled]` → `Now: [new person or Unfilled]`.
  - Confirmation: user must type the draft name exactly.
  - "Promote" button activates only when the typed name matches.
- "Cancel" closes without side effects.

### 8.2 Transaction (server-side RPC)

A single PL/pgSQL function, `promote_draft(draft_id uuid)`, performs these steps in a transaction:

1. Verify the caller is in `user_access` (RLS enforces this at the table level too).
2. Load `draft_assignments` for the draft and current `master_assignments`.
3. For each calling:
   - If the draft has an assignment and master does not → insert, `set_apart = false`.
   - If both exist and `person_id` matches → preserve `set_apart`.
   - If both exist and `person_id` differs → replace; `set_apart = false`.
   - If master has an assignment and the draft does not → delete master row.
4. Drop any `draft_staging` rows; the staged people simply become unassigned (they have no master row, which is the unassigned state).
5. Set `drafts.archived = true` for this draft.
6. Update `master_meta` with `last_promoted_at`, `last_promoted_by`, `last_promoted_from_draft`.
7. Insert a `promotion_history` row with the full jsonb snapshot of post-promotion master state (including embedded person names).

Called / Sustained are **not** written to master; they are draft-only bookkeeping and are not preserved in `promotion_history`.

### 8.3 No revert

Undo is not a feature. To fix a bad promotion, create a new draft. `promotion_history` is read-only audit.

---

## 9. Real-time

Supabase Realtime subscriptions on:

- `master_assignments` — live updates to the master grid and the Set Apart toggles
- `drafts` — live updates to the drafts list
- `draft_assignments` — live updates when editing a draft with another user present
- `draft_staging` — live updates to the staging rail

**Conflict model:** last-write-wins. No CRDTs, no operational transforms. If two users edit the same calling at once, the second write overwrites the first; both see the final state within a second or two via the subscription.

**Presence:** a single channel per route (one for `/`, one per `/drafts/[id]`) tracks connected users. Header shows "N members here" when N > 1. No avatars, no names, no individual identification in MVP.

---

## 10. Performance & Accessibility

- Scale is trivial (~23 orgs × ~5–10 callings × ~143 people). No pagination, virtualization, or caching beyond the default Supabase client and Next.js page caching.
- Every drag interaction has a tap-to-move fallback.
- Visible focus rings on all interactive elements.
- ≥50% luminance contrast for all text.
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, buttons not divs.
- No search-engine indexing (`robots` meta `noindex`, `noindex,nofollow` in route metadata).

---

## 11. File & Repo Conventions

- Standard Next.js App Router layout: `app/`, `components/`, `lib/`, `supabase/`.
- Kebab-case filenames (`org-card.tsx`) except Next-required names (`layout.tsx`, `page.tsx`, `middleware.ts`).
- Migrations: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`.
- Seed migration: `supabase/migrations/00000000000001_seed.sql` (or similar, sorted first).
- Git commits: imperative subject, no emoji, no "chore:"/"feat:" prefixes.
- Markdown spec files: `YYYY-MM-DD-description.md`.

---

## 12. Testing

- Strict TypeScript (`"strict": true`, `"noUncheckedIndexedAccess": true`).
- ESLint with `next/core-web-vitals`.
- No test runner for MVP.
- Manual QA via `npm run dev` on Ryan's machine.
- If the promotion transaction ever misbehaves, add Vitest for the RPC's edge cases first.

---

## 13. Out of Scope (MVP)

- Email notifications of any kind.
- Excel/CSV import/export.
- Multi-ward UI.
- Uploaded avatar photos.
- Revert / undo for promotions.
- Shareable filtered URLs.
- Offline support.
- Per-user role hierarchy.
- In-app user invitation flow (provisioning stays in the Supabase dashboard).
- Automated tests (Vitest / Playwright).

---

## 14. Open Items

None at this time. All decisions from the source spec's "Open decisions" section have been resolved in this document.

---

## 15. Source Documents

- `rc-calling-matrix-spec.md` — original technical spec (superseded by this document where they differ).
- `rc-calling-matrix-design.md` — Church visual guide alignment (source of truth for type and primary color; superseded only on the master/draft accent-color distinction).
- `rc-calling-matrix.jsx` — reference implementation for data shape, interaction model, and seed data. Not a source of truth for styling.
- `rc-calling-matrix.xlsx` — original spreadsheet. Not parsed by code; JSX embedded JSON is used instead.
