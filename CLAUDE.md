# CLAUDE.md — Rancho Carrillo Calling Matrix

A multi-user Next.js + Supabase web app that replaces the Rancho Carrillo Ward bishopric's read-only Excel calling matrix with a collaborative master/draft editor.

## Source of truth (read first)

1. **[Design spec](docs/superpowers/specs/2026-04-19-rc-calling-matrix-design.md)** — authoritative. All design decisions live here.
2. **[Implementation plan](docs/superpowers/plans/2026-04-19-rc-calling-matrix.md)** — 40-task plan currently in progress (see Status below).
3. **[Original spec from Ryan](docs/source/rc-calling-matrix-spec.md)** — historical input that informed the design doc.
4. **[JSX reference artifact](docs/source/rc-calling-matrix.jsx)** — used as a UX/data reference only. **Do not** copy patterns from it; the design doc supersedes it.

## Status (as of 2026-04-19, end of session 1)

**Plan progress: 11/40 tasks complete.** Phase 0 (preflight), Phase 1 (Next.js scaffolding), and Phase 2 (Supabase backend) are done. Next session resumes at **Task 11: Supabase client helpers**.

| Phase | Tasks | Status |
|---|---|---|
| 0 — Preflight | 0 | done |
| 1 — Scaffolding | 1–5 | done |
| 2 — Supabase backend | 6–10 | done |
| 3 — Auth | 11–15 | next |
| 4 — Domain types + utilities | 16–17 | pending |
| 5 — Master view | 18–25 | pending |
| 6 — Drafts | 26–30 | pending |
| 7 — Realtime | 31–33 | pending |
| 8 — Admin | 34–38 | pending |
| 9 — Header nav | 39 | pending |
| 10 — Deploy | 40 | pending |

## How to resume tomorrow

1. Read this file, the design spec, and the implementation plan.
2. Follow `superpowers:subagent-driven-development` — the workflow used in session 1. Dispatch a fresh subagent per task; spec-review then code-quality-review after each (skip the formal review for trivial mechanical tasks like file moves and tsconfig edits).
3. Resume at Task 11. The plan file has every task spelled out with file paths, full code blocks, and verification steps.
4. Trivial / mechanical Supabase-MCP tasks (write SQL → apply migration → verify → commit) are faster done by the controller directly than via subagent.

## Stack (locked-in)

- **Next.js 16** (App Router, TypeScript strict, `noUncheckedIndexedAccess`)
- **React 19**
- **Tailwind CSS v3** — manually downgraded from the v4 default in Task 4. Do **not** upgrade to v4 without rewriting the design tokens in `app/globals.css` and `tailwind.config.ts`. The plan's CSS uses `@tailwind base/components/utilities` directives, which are v3 syntax.
- **Supabase** — Postgres + Auth + Realtime + RPCs. Project: `calling-matrix-dev` on org "Ryan Bunker".
  - Project ID: `rhdcjakrotxeeacuwgmp`
  - URL: `https://rhdcjakrotxeeacuwgmp.supabase.co`
  - Region: `us-west-1`
  - Cost: $10/mo (Pro tier, recurring)
- **Fonts** — Source Serif 4 (serif), Inter (sans), JetBrains Mono (mono), all via `next/font/google`.
- **Auth** — `@supabase/supabase-js` + `@supabase/ssr` (cookie-based). Middleware-gated routes. No reset emails — admin resets passwords manually.
- **Hosting** — Vercel (default subdomain). Production Supabase project gets created in Task 40.

## Key facts to remember

- **Single-ward MVP.** `WARD_ID = '00000000-0000-0000-0000-000000000001'` is hardcoded everywhere. Multi-ward is out of scope.
- **Flat collab.** Every authenticated user (anyone in `user_access`) has full read/write. No role hierarchy.
- **Master is read-only** except the Set Apart toggle. All other edits happen in copy-on-write **drafts** that are promoted back to master via the `promote_draft(uuid)` RPC.
- **Hard deletes with `ON DELETE CASCADE`** on assignment tables. Names are preserved in `promotion_history.snapshot` (jsonb) for audit. No FK from history.
- **Promotion is atomic** — handled by the `promote_draft` RPC in `supabase/migrations/20260419120200_rpcs.sql`. Preserves `set_apart` only when the same person stays in the same calling.
- **Tap-to-move UX** is primary; HTML5 drag is skipped for MVP.
- **Realtime via Supabase `postgres_changes` + presence channels** — wired in Tasks 31–33.

## Divergences from the plan (already applied)

- **Task 1** — `create-next-app` installed Next.js 16 (not 14). Working fine; flagged for context.
- **Task 4** — Tailwind v4 → v3 downgrade was added (plan was written for v3, scaffolder defaulted to v4). New `postcss.config.mjs` uses v3-style plugin config.
- **Task 8** — RLS policy SQL had a bug in the plan: `format('create policy %I_select on %I ...', t||'_s', t)` would have produced invalid SQL (quoted identifier followed by literal text). Fixed by dropping the `_select`/`_insert`/`_update`/`_delete` suffix from the format string. Policies are now `<table>_s|i|u|d`.
- **Task 10** — Used the Step-5 fixed generator directly (skipped Step 1 buggy version). Final row counts: 143 people, 23 orgs, 176 callings, 146 assignments. The plan estimated ~108 callings and ~130 assignments — actual is higher because Sunday School / Primary / Relief Society / Stake Callings have more positions than the rough estimate suggested.

## Open items for next session

- **Task 11–14** — Auth scaffolding. Should be straightforward.
- **Task 15** — Provision Ryan's user. Will need Ryan's chosen admin password (he said he'd send it in a follow-up message). Confirmed email is `rbunker@abpcapital.com`. Skip the temp-password / set-password flow for him.
- **Task 40** — Will need a separate `calling-matrix-prod` Supabase project ($10/mo additional) and Vercel deploy authorization. Vercel preview env vars point to dev; production env vars point to prod.

## Workflow conventions

- Working dir: `c:\Users\rbunker\claude-workspace\projects\church\rc-calling-matrix`
- Branch: `main`. Remote: `https://github.com/bunkerryan-source/rc-calling-matrix`
- Commit per task. Commit messages use imperative mood, no Claude trailer per Ryan's preference.
- Manual QA only — no automated test runner in MVP. "Run the test" steps in the plan are smoke checks via `npm run dev`.
- Migrations live at `supabase/migrations/` and are applied via the Supabase MCP (`mcp__claude_ai_Supabase__apply_migration`). Already applied: initial schema, RLS, RPCs, seed.

## Stack-specific gotchas

- Next.js 16 default uses Turbopack. The `--no-turbopack` flag was passed during scaffold but may have been a no-op.
- `app/page.tsx` JSX intrinsic types: `react-jsx` mode (set by create-next-app, kept).
- `paths` in tsconfig: `"@/*": ["./*"]` — root-anchored, no `src/` prefix.
- `.env.local` is committed-ignored via the `.env*` pattern in `.gitignore`. `.env.example` was force-added (`git add -f`) since the same pattern would otherwise exclude it.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
