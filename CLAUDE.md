# CLAUDE.md — Rancho Carrillo Calling Matrix

A multi-user Next.js + Supabase web app that replaces the Rancho Carrillo Ward bishopric's read-only Excel calling matrix with a collaborative master/draft editor.

## Source of truth (read first)

1. **[Design spec](docs/superpowers/specs/2026-04-19-rc-calling-matrix-design.md)** — authoritative. All design decisions live here.
2. **[Implementation plan](docs/superpowers/plans/2026-04-19-rc-calling-matrix.md)** — 40-task plan, all tasks complete.
3. **[Original spec from Ryan](docs/source/rc-calling-matrix-spec.md)** — historical input that informed the design doc.
4. **[JSX reference artifact](docs/source/rc-calling-matrix.jsx)** — used as a UX/data reference only. **Do not** copy patterns from it; the design doc supersedes it.

## Status (as of 2026-04-21, end of session 5)

**MVP shipped.** All 40 plan tasks complete. Live at **https://rccallingmatrix.vercel.app**.

Phase 3–10 (Auth, Domain types, Master view, Drafts, Realtime, Admin, Header nav, Deploy) landed in session 2. Session 3 shipped admin RPC-based user grant flow plus three auth bug fixes (see below). Session 4 added Bishop / 1st Counselor / 2nd Counselor sidebar role tabs. Session 5 added the per-change communicator assignment (B / 1st / 2nd toggle) on each row in a draft's Changes from Master panel.

## How to pick up next session

1. Read this file, the design spec, and the original spec.
2. Site is live — start by running smoke checks against production before making changes.
3. For new features, still use the `superpowers:subagent-driven-development` workflow (fresh subagent per task; spec-review then code-quality-review).
4. Pushes to `origin/main` auto-deploy to Vercel production.

## Stack (locked-in)

- **Next.js 16** (App Router, TypeScript strict, `noUncheckedIndexedAccess`)
- **React 19**
- **Tailwind CSS v3** — manually downgraded from the v4 default. Do **not** upgrade to v4 without rewriting the design tokens in `app/globals.css` and `tailwind.config.ts`. The plan's CSS uses `@tailwind base/components/utilities` directives, which are v3 syntax.
- **Supabase** (same project serves dev and prod in MVP):
  - Name: `calling-matrix-dev` on org "Ryan Bunker"
  - Project ID: `rhdcjakrotxeeacuwgmp`
  - URL: `https://rhdcjakrotxeeacuwgmp.supabase.co`
  - Region: `us-west-1`
  - Cost: $10/mo (Pro tier, recurring)
- **Fonts** — Source Serif 4 (serif), Inter (sans), JetBrains Mono (mono), all via `next/font/google`.
- **Auth** — `@supabase/supabase-js` + `@supabase/ssr` (cookie-based). Routes gated by `proxy.ts` (Next.js 16 renamed middleware → proxy). No reset emails — admin resets passwords manually via Supabase dashboard.
- **Hosting** — Vercel, team `bunkerryan-sources-projects`, project `rccallingmatrix`. GitHub integration is wired (auto-deploy on push to main).

## Key facts to remember

- **Single-ward MVP.** `WARD_ID = '00000000-0000-0000-0000-000000000001'` is hardcoded everywhere. Multi-ward is out of scope.
- **Flat collab.** Every authenticated user (anyone in `user_access`) has full read/write. No role hierarchy.
- **Master is read-only** except the Set Apart toggle. All other edits happen in copy-on-write **drafts** that are promoted back to master via the `promote_draft(uuid)` RPC.
- **Hard deletes with `ON DELETE CASCADE`** on assignment tables. Names are preserved in `promotion_history.snapshot` (jsonb) for audit. No FK from history.
- **Promotion is atomic** — handled by the `promote_draft` RPC in `supabase/migrations/20260419120200_rpcs.sql`. Preserves `set_apart` only when the same person stays in the same calling.
- **Tap-to-move UX** is primary; HTML5 drag is skipped for MVP. The tap-to-move logic lives entirely on the `CallingRow` `<li>` onClick — the PersonChip inside a calling row has no click handler, so taps bubble up. Row decides pickup vs. drop from `drag.active`.
- **Realtime via Supabase `postgres_changes` + presence channels** — master and draft views both subscribe.
- **Sidebar groups** — the sidebar in master/draft views groups orgs into virtual entries (Young Men = Deacons+Teachers+Priests; Young Women = YW umbrella + 11-12/13-14/15-18; Misc = the 9 aux orgs). Config lives inline in `components/sidebar-filter.tsx`. Underlying filter state still stores raw org slugs.

## Deployment info

- **Production URL:** https://rccallingmatrix.vercel.app (bare alias; also reachable at `rccallingmatrix-bunkerryan-sources-projects.vercel.app`)
- **Vercel project:** `prj_8MsLDHA5bZlRUdqvl674cGVquVj2` (team `team_cvOrlfMiLR7nAdZryqer1lEn`)
- **Env vars (production scope):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — both point at the dev Supabase project.
- **Admin user:** `bunker.ryan@gmail.com` — created via Supabase dashboard, `must_change_password: false`. (Plan originally specified `rbunker@abpcapital.com`; swapped to Gmail during session 2.)
- **Gotcha: `vercel project add` creates projects with framework preset "Other"**, not auto-detected. Must be changed to **Next.js** in the Vercel dashboard Settings → Build & Development Settings before the first deploy will serve anything — otherwise Vercel looks for static files in `./public` and every route returns 404. CLI has no command to set this; dashboard only.
- **Gotcha: Vercel "Deployment Protection" is on by default for new projects.** That's an SSO wall — users without a Vercel login get 404. Must be disabled in Settings → Deployment Protection for a public-facing app that uses its own auth.

## Known divergences from the plan

- **Task 1** — `create-next-app` installed Next.js 16 (plan said 14). Working fine.
- **Task 4** — Tailwind v4 → v3 downgrade.
- **Task 8** — RLS policy migration SQL had a bug in the plan; fixed to produce valid policy names (`<table>_s|i|u|d`).
- **Task 10** — Final seed counts: 143 people, 23 orgs, 176 callings, 146 assignments (plan under-estimated because Sunday School / Primary / RS / Stake Callings have more positions than expected).
- **Task 15** — Admin user email is `bunker.ryan@gmail.com`, not `rbunker@abpcapital.com`.
- **Task 40** — Plan called for a separate `calling-matrix-prod` Supabase project. Skipped — prod Vercel points at the dev Supabase project. Low-stakes ward tool; can split later if needed.

## Post-deploy bugs fixed (session 2)

- **Middleware → proxy** — Next.js 16 renamed the convention. `middleware.ts` → `proxy.ts`, exported function is `proxy`. `lib/supabase/middleware.ts` helper kept the old name (it's not a Next.js convention file).
- **`useSearchParams` needs Suspense** — Next.js 16 strict prerendering. `app/sign-in/page.tsx` wraps the form in `<Suspense>`.
- **Turbopack cache corruption after rename** — `rm -rf .next` (Windows: `rmdir /s /q .next`) clears it.
- **Tap-to-move not working** — first attempted fix (stopPropagation on PersonChip) only handled one leg. Final fix: moved all pickup+drop logic to `CallingRow`'s `<li>` onClick; chip has no click handler of its own inside calling rows. Commit `35ffad0`.
- **Sidebar mis-grouped** — initially showed one pill per org; updated to grouped entries per ward spec. Young Women umbrella org moved from Misc → Young Women group. Commit `87e07b4`.

## Session 3 — Admin grant flow + auth fixes

- **Admin "Grant access" UI** — new Users tab on `/admin` lets admins paste an email + optional display name to grant ward access without SQL. Backed by two SECURITY DEFINER RPCs in `supabase/migrations/20260420130000_admin_user_rpcs.sql`: `admin_list_user_access()` and `admin_grant_access(target_email, display_name)`. Each RPC re-checks the caller already has ward access. User must still be created in the Supabase dashboard first (Authentication → Users → Create new user) — the Supabase dashboard does NOT let you set a temp password at creation time; password must be set afterward via the user's row or via `supabase.auth.admin.updateUserById` / an admin reset.
- **Ambiguous column bug in admin RPCs** — `RETURNS TABLE (user_id uuid, ...)` creates implicit OUT params that shadow column references. The existence check `where user_id = auth.uid()` errored "column reference 'user_id' is ambiguous". Fix: alias `user_access` as `ua` in both RPCs. `supabase/migrations/20260420140000_admin_user_rpcs_fix.sql`.
- **Set-password infinite spinner** — `supabase.auth.updateUser({ password, data: { must_change_password: false } })` succeeded, but the cookie still carried stale `user_metadata` so middleware kept redirecting back to `/account/set-password`. Since the redirect target matched the current route, React preserved the form's `submitting=true` state and the button stayed "Saving…" forever. Fix: `await supabase.auth.refreshSession()` (rewrites the cookie with updated metadata), then `window.location.assign('/')` (hard reload resets React state). `app/account/set-password/page.tsx`.
- **`must_change_password` flag** — stored in `auth.users.raw_user_meta_data` JSONB. To set for a user via the SQL editor:
  ```sql
  update auth.users
  set raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb) || '{"must_change_password": true}'::jsonb
  where email = '<target email>';
  ```
  Admin UI reads this flag via the RPC and shows a "needs password change" badge on the user row.
- **Cascade gotcha** — deleting a user in Supabase Auth CASCADE-drops their `user_access` row. Recreating with the same email gives a new `user_id`, so the old grant is gone — you have to grant access again. Bit me once with `rbunker@abpcapital.com` during session 3 testing.

## Session 4 — Bishopric role tabs

- **Sidebar Bishop / 1st Counselor / 2nd Counselor tabs.** Three new entries at the bottom of the sidebar (between Misc and the Set Apart / No Calling toggles, separated by their own divider) group the orgs each bishopric member oversees. Behave identically to the existing Young Men / YW / Misc grouped entries — clicking toggles the entry's full slug set on/off, count badge sums child org callings, active when every child slug is present. Static client-side config in `components/sidebar-filter.tsx` — no DB changes. Spec: [docs/superpowers/specs/2026-04-21-bishopric-role-tabs-design.md](docs/superpowers/specs/2026-04-21-bishopric-role-tabs-design.md). Commit `7e1016e`.
- **Note for whoever lands queued idea #1.** When the per-org bishopric-member name header lands, the static role config in `BISHOPRIC_ROLE_ENTRIES` should be replaced with a DB-driven version derived from the same source of truth, so admin can edit assignments in-app and both features stay in sync.

## Session 5 — Communicator assignment

- **Per-change communicator toggle.** Each row in the draft "Changes from Master" panel gets three small pill buttons — `B`, `1st`, `2nd` — assigning a bishopric member to follow up with that person. Click an inactive pill to set; click the active pill to clear; click a different pill to swap. State lives in a new `draft_change_communicator` table keyed `(draft_id, person_id)` with the same blanket RLS as every other table. Realtime via a third `postgres_changes` subscription in `DraftViewInner`. Spec: [docs/superpowers/specs/2026-04-21-draft-communicator-assignment-design.md](docs/superpowers/specs/2026-04-21-draft-communicator-assignment-design.md). Migration: `supabase/migrations/20260421120000_draft_change_communicator.sql`.
- **Ephemeral by design.** The communicator assignment is never copied into `master_assignments` or `promotion_history.snapshot`, and is not shown in the Promote modal or the History view. The rows live on the draft and cascade-delete when the draft is deleted. Promotion archives the draft (existing behavior) but does not delete its communicator rows — they remain visible if the archived draft is reopened.
- **Garbage collection: none.** When a person leaves the diff (e.g., a user reverts the change that put them there), their communicator row stays in the table but renders nowhere. If they re-enter the diff later, their prior role reappears.
- **Update the queued-ideas list.** Idea #2 ("Per-change communicator assignment in draft diffs") is now done — strike it from the list or move it to a "shipped" subsection.

## Workflow conventions

- Working dir: `c:\Users\rbunker\claude-workspace\projects\church\rc-calling-matrix`
- Branch: `main`. Remote: `https://github.com/bunkerryan-source/rc-calling-matrix`
- Commit per task. Imperative mood, no Claude trailer per Ryan's preference.
- Manual QA only — no automated test runner. Smoke checks via `npm run dev` locally and against prod after deploy.
- Migrations at `supabase/migrations/` applied via the Supabase MCP. Already applied: initial schema, RLS, RPCs, seed.
- `.vercel/` directory is gitignored (added by `vercel link`).

## Stack-specific gotchas

- Next.js 16 default uses Turbopack. The `--no-turbopack` flag was passed during scaffold but may have been a no-op.
- `app/page.tsx` JSX intrinsic types: `react-jsx` mode (set by create-next-app, kept).
- `paths` in tsconfig: `"@/*": ["./*"]` — root-anchored, no `src/` prefix.
- `.env.local` is committed-ignored via the `.env*` pattern in `.gitignore`. `.env.example` was force-added (`git add -f`).

## Potential next steps

- End-to-end smoke test on prod by the bishopric.
- Add bishopric members to `user_access` via the Admin tab (each needs a Supabase auth user created first via dashboard, then grant via UI).
- **One-shot user creation** — collapse "create user in dashboard + set temp password + mark must_change_password + grant access" into a single admin action. Requires a Next.js API route that calls `supabase.auth.admin.createUser` with the service-role key (stored server-side only). Ryan said yes to this in session 3 but we bailed to chase bugs; still queued.
- If concurrent editing proves messy, consider splitting a dedicated prod Supabase project.
- Consider swapping tap-to-move for real HTML5 drag if bishopric members find click-then-click unintuitive (currently intentional per spec).

## Queued feature ideas (raised end of session 3)

1. **Bishopric-in-charge header per org.** Under each org heading in master/draft views (e.g., below "Deacons Quorum" and above "President"), indicate the bishopric member assigned to oversee that organization. Needs a new table mapping `org_id → bishopric_user_id` (or a dedicated role/field on `orgs`), an admin UI to set it, and a read-only label on each org section header.
2. **Per-change communicator assignment in draft diffs.** In a draft's Changes section, let the editor toggle which bishopric member is responsible for communicating that specific change to the affected individual. Probably a new column on the draft-change row (e.g., `assigned_communicator_user_id`) with a small dropdown per row, plus surfacing the assignment in the post-promotion snapshot for follow-through.
3. **Read-only role for master.** New admin tier where a user can see the master view but cannot create drafts, edit the set-apart toggle, or see/use the admin tab. Requires a `role` column on `user_access` (e.g., `viewer` | `editor` | `admin`) plus RLS policy updates and client-side gating on draft/admin routes.
4. **Restrict promote to bishopric.** Only users with a `bishopric` / `admin` role should be able to call `promote_draft`. Needs the role column above and a check inside the `promote_draft` RPC (raise exception if caller role isn't bishopric) plus hiding the Promote button in the UI for non-bishopric users.
5. **Report exports.** Potential exports: full current master (org → calling → person → set-apart state), a draft's proposed changes, and promotion history over a date range. Candidate formats: CSV and PDF. Could ship as a "Reports" tab on admin or a printer-friendly route. No backend work needed beyond a server-rendered page for the PDF path; CSV can be generated client-side from existing queries.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
