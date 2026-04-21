# Bishopric Role Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Bishop / First Counselor / Second Counselor filter tabs to the sidebar, each grouping the orgs that bishopric member oversees, behaving identically to the existing Young Men / YW / Misc group entries.

**Architecture:** Pure frontend change to one component. Split the existing flat `SIDEBAR_ENTRIES` constant into two arrays (`MAIN_ENTRIES`, `BISHOPRIC_ROLE_ENTRIES`), render each in its own list with a divider between them, and extract the per-entry JSX into a tiny helper to stay DRY. No data layer, RPC, or schema changes.

**Tech Stack:** Next.js 16 (App Router, TS strict), React 19, Tailwind v3. No automated test runner — manual QA per project convention. Auto-deploy to Vercel on push to `main`.

**Spec:** [docs/superpowers/specs/2026-04-21-bishopric-role-tabs-design.md](../specs/2026-04-21-bishopric-role-tabs-design.md)

---

## File Structure

- **Modify:** `components/sidebar-filter.tsx` — only file touched. Replace the single `SIDEBAR_ENTRIES` constant with two named arrays, add a `renderEntry` helper local to the component, and update the JSX to render both arrays separated by a divider.

No new files. No deletions. No other files affected — `lib/filter-state.ts`, page components, and consumers of `SidebarFilter` all stay as-is because the prop surface is unchanged and `FilterState` is unchanged.

---

## Task 1: Refactor sidebar config and add role tabs

**Files:**
- Modify: `components/sidebar-filter.tsx` (full file replacement)

- [ ] **Step 1: Read the current file to confirm starting state**

Run: read `components/sidebar-filter.tsx` end to end. Confirm it matches the version with `SIDEBAR_ENTRIES` as a single 10-entry array and a single `.map()` block in the JSX. If the file has drifted, stop and reconcile before editing.

- [ ] **Step 2: Replace the file contents**

Overwrite `components/sidebar-filter.tsx` with exactly this content:

```tsx
'use client';

import { useFilterState, type FilterState } from '@/lib/filter-state';
import type { Organization } from '@/lib/types';

type SidebarEntry =
  | { type: 'single'; label: string; slug: string }
  | { type: 'group'; label: string; slugs: string[] };

const MAIN_ENTRIES: SidebarEntry[] = [
  { type: 'single', label: 'Bishopric', slug: 'bishopric' },
  { type: 'single', label: 'Clerks/Extended Bishopric', slug: 'clerks-extended-bishopric' },
  { type: 'group', label: 'Young Men', slugs: ['deacons-quorum', 'teachers-quorum', 'priests-quorum'] },
  { type: 'group', label: 'Young Women', slugs: ['young-women', 'young-women-11-12', 'young-women-13-14', 'young-women-15-18'] },
  { type: 'single', label: 'Sunday School', slug: 'sunday-school' },
  { type: 'single', label: 'Relief Society', slug: 'relief-society' },
  { type: 'single', label: "Elder's Quorum", slug: 'elders-quorum' },
  { type: 'single', label: 'Primary', slug: 'primary' },
  { type: 'single', label: 'Stake Callings', slug: 'stake-callings' },
  {
    type: 'group',
    label: 'Misc',
    slugs: [
      'emergency-prep',
      'music',
      'employment',
      'single-adults',
      'ward-history',
      'friendship-meal-coordination',
      'temple-prep',
      'building-maintenance',
      'ward-activities',
    ],
  },
];

const BISHOPRIC_ROLE_ENTRIES: SidebarEntry[] = [
  {
    type: 'group',
    label: 'Bishop',
    slugs: [
      'priests-quorum',
      'young-women-15-18',
      'clerks-extended-bishopric',
      'young-women',
      'elders-quorum',
      'relief-society',
    ],
  },
  {
    type: 'group',
    label: 'First Counselor',
    slugs: [
      'teachers-quorum',
      'young-women-13-14',
      'sunday-school',
      'emergency-prep',
      'music',
      'employment',
      'single-adults',
      'ward-history',
      'friendship-meal-coordination',
      'temple-prep',
    ],
  },
  {
    type: 'group',
    label: 'Second Counselor',
    slugs: [
      'deacons-quorum',
      'young-women-11-12',
      'primary',
      'building-maintenance',
      'ward-activities',
    ],
  },
];

function entrySlugs(e: SidebarEntry): string[] {
  return e.type === 'single' ? [e.slug] : e.slugs;
}

export function SidebarFilter({
  userId,
  organizations,
  counts,
  noCallingCount,
  mode,
  onChange,
}: {
  userId: string | null;
  organizations: Organization[];
  counts: Map<string, number>;
  noCallingCount: number;
  mode: 'master' | 'draft';
  onChange: (s: FilterState) => void;
}) {
  const [state, save] = useFilterState(userId);

  const orgIdBySlug = new Map(organizations.map((o) => [o.slug, o.id]));

  function commit(next: FilterState) { save(next); onChange(next); }

  function entryCount(e: SidebarEntry): number {
    let total = 0;
    for (const slug of entrySlugs(e)) {
      const id = orgIdBySlug.get(slug);
      if (id) total += counts.get(id) ?? 0;
    }
    return total;
  }

  function entryActive(e: SidebarEntry): boolean {
    const slugs = entrySlugs(e);
    return slugs.length > 0 && slugs.every((s) => state.orgSlugs.has(s));
  }

  function toggleEntry(e: SidebarEntry) {
    const slugs = entrySlugs(e);
    const next: FilterState = { ...state, all: false, orgSlugs: new Set(state.orgSlugs) };
    const allOn = slugs.every((s) => next.orgSlugs.has(s));
    if (allOn) {
      for (const s of slugs) next.orgSlugs.delete(s);
    } else {
      for (const s of slugs) next.orgSlugs.add(s);
    }
    if (next.orgSlugs.size === 0 && !next.setApart && !next.noCalling) next.all = true;
    commit(next);
  }

  const accent = mode === 'draft' ? 'bg-draft text-white' : 'bg-primary text-white';
  const unselected = 'bg-white text-black/80 hover:bg-black/5';

  function pillClass(active: boolean) {
    return `w-full text-left px-3 py-1.5 rounded text-sm flex items-center justify-between ${active ? accent : unselected}`;
  }

  function renderEntry(e: SidebarEntry) {
    const active = entryActive(e);
    const count = entryCount(e);
    return (
      <button key={e.label} className={pillClass(active)} onClick={() => toggleEntry(e)}>
        <span>{e.label}</span>
        <span className="font-numeric text-xs opacity-70">{count}</span>
      </button>
    );
  }

  return (
    <nav className="w-[220px] shrink-0 border-r border-black/10 bg-white h-full p-3 overflow-y-auto">
      <button
        className={pillClass(state.all)}
        onClick={() => commit({ all: true, orgSlugs: new Set(), setApart: false, noCalling: false })}
      >
        <span>All</span>
      </button>
      <div className="mt-2 space-y-1">
        {MAIN_ENTRIES.map(renderEntry)}
      </div>
      <div className="my-3 border-t border-black/10" />
      <div className="space-y-1">
        {BISHOPRIC_ROLE_ENTRIES.map(renderEntry)}
      </div>
      <div className="my-3 border-t border-black/10" />
      {mode === 'master' && (
        <button className={pillClass(state.setApart)}
                onClick={() => commit({ ...state, all: false, setApart: !state.setApart })}>
          <span>Set Apart</span>
        </button>
      )}
      <button className={pillClass(state.noCalling)}
              onClick={() => commit({ ...state, all: false, noCalling: !state.noCalling })}>
        <span>No Calling</span>
        <span className="font-numeric text-xs opacity-70">{noCallingCount}</span>
      </button>
    </nav>
  );
}
```

- [ ] **Step 3: Type-check and build**

Run: `npm run build`

Expected: Build completes successfully. No TypeScript errors. No lint errors. (Next.js 16 runs lint as part of build by default.)

If the build fails, fix the underlying issue. Do not bypass with `--no-verify` or skip flags.

- [ ] **Step 4: Local smoke check**

Run: `npm run dev`

Open `http://localhost:3000` in a browser. Sign in as `bunker.ryan@gmail.com`. Then verify all of the following on the master view:

1. Sidebar shows three new tabs **Bishop**, **First Counselor**, **Second Counselor** in that order, positioned between **Misc** and **Set Apart**.
2. A horizontal divider line is visible above **Bishop** (between Misc and Bishop).
3. A horizontal divider line is visible below **Second Counselor** (between Second Counselor and Set Apart).
4. **Bishop** count badge equals: callings(priests-quorum) + callings(young-women-15-18) + callings(clerks-extended-bishopric) + callings(young-women) + callings(elders-quorum) + callings(relief-society).
5. **First Counselor** count badge equals the sum of its 10 orgs' callings.
6. **Second Counselor** count badge equals the sum of its 5 orgs' callings.
7. Click **Bishop** → exactly the 6 Bishop orgs are visible in the main grid; tab is highlighted.
8. Click **Bishop** again → all 6 deselect; sidebar returns to "All" if no other selections active.
9. With **Bishop** active, click the standalone **Clerks/Extended Bishopric** pill → the Clerks pill toggles off, that org disappears from the grid, and the **Bishop** tab loses its highlight (because it no longer has *every* slug present).
10. Click **First Counselor** → exactly its 10 orgs visible.
11. Click **Second Counselor** → exactly its 5 orgs visible.
12. **Existing entries still work:** click **Young Men** → 3 orgs; click **Young Women** → 4 orgs; click **Misc** → 9 orgs; click **All** → resets.
13. **Set Apart** toggle still works on master view.
14. **No Calling** still toggles and shows count.
15. Switch to a draft view (or open a draft) → confirm the same three role tabs appear with the same dividers, and the **Set Apart** toggle is correctly hidden in draft view.
16. Refresh the page → filter selection persists (localStorage).

If any check fails, fix and re-verify before moving on.

- [ ] **Step 5: Commit**

```bash
git add components/sidebar-filter.tsx
git commit -m "Add Bishop, First Counselor, Second Counselor sidebar role tabs"
```

- [ ] **Step 6: Push to deploy**

```bash
git push origin main
```

This auto-deploys to Vercel production. Wait for the deployment to finish (typically 30-90 seconds). The Vercel dashboard or `vercel ls` shows status.

- [ ] **Step 7: Production smoke check**

Open `https://rccallingmatrix.vercel.app/` in an incognito browser window. Sign in. Repeat smoke checks 1, 2, 3, 7, 10, 11 from Step 4 against production. If any fail, investigate before considering the task complete.

---

## Task 2: Update project status

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add a Session 4 section to CLAUDE.md**

Open `CLAUDE.md`. Just above the `## Workflow conventions` heading, add a new section. Use the same format and tone as the existing `## Session 3 — Admin grant flow + auth fixes` section. The new section should:

- Be titled `## Session 4 — Bishopric role tabs`.
- Mention that three new sidebar tabs (Bishop, First Counselor, Second Counselor) ship as a static client-side config in `components/sidebar-filter.tsx`.
- Note the role → org mapping is hardcoded (link to the spec at `docs/superpowers/specs/2026-04-21-bishopric-role-tabs-design.md`).
- Note that this deliberately does not lay groundwork for queued idea #1 (showing the bishopric member's name on each org header) — when #1 lands, the static config should be replaced with a DB-driven version.

Also update the `## Status (as of <date>, end of session N)` line at the top of the file: bump date to `2026-04-21` and `session 4`, and add one short sentence: "Session 4 added Bishop/1st/2nd Counselor sidebar tabs."

Also remove the **Bishopric-in-charge header per org** queued item from the "Queued feature ideas" list ONLY IF this feature satisfied it. (It does NOT — the queued item is about per-org name display, not sidebar filtering. So leave it in place.)

- [ ] **Step 2: Commit and push**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md: session 4 (bishopric role tabs)"
git push origin main
```

---

## Self-Review Notes

- **Spec coverage:** Every section of the spec maps to Task 1.
  - Sidebar layout → Step 2 (JSX with two divider blocks).
  - Three role-to-org assignments → Step 2 (`BISHOPRIC_ROLE_ENTRIES` constant; slugs match spec exactly).
  - Behavior (toggle, count, active highlight, stack, overlap) → unchanged from existing `toggleEntry`/`entryCount`/`entryActive` and verified by smoke checks 4-12.
  - Implementation shape (split arrays, render helper, divider markup) → Step 2.
  - Out of scope items → not implemented, called out in the design doc and Task 2 commentary.
  - Acceptance criteria → all 7 covered by smoke check items 1-16 in Task 1 Step 4.
- **Placeholder scan:** No TBD/TODO. All slug names are concrete. All commands are exact. All commit messages are written.
- **Type consistency:** `SidebarEntry` type is unchanged. `MAIN_ENTRIES` and `BISHOPRIC_ROLE_ENTRIES` both use that type. `renderEntry` accepts a `SidebarEntry`. The component prop surface is unchanged so no consumers break.
- **Slug spelling check:** All 21 role-tab slugs (6 + 10 + 5) appear verbatim in either `MAIN_ENTRIES` or one of its inline arrays in the same file. No typos vs. the existing canonical slugs.
