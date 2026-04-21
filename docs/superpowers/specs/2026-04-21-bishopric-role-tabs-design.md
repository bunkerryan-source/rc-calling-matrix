---
title: Bishopric Role Tabs in Sidebar
date: 2026-04-21
status: approved
---

# Bishopric Role Tabs in Sidebar

## Goal

Add three new sidebar filter entries — **Bishop**, **First Counselor**, **Second Counselor** — that group the organizations each bishopric member oversees. Clicking a role tab applies the same group-toggle behavior the existing Young Men / Young Women / Misc entries already use.

## Scope

Frontend-only change to [components/sidebar-filter.tsx](../../../components/sidebar-filter.tsx). No DB migrations, no new files, no changes to filter state, page wiring, queries, RLS, or RPCs.

## Sidebar layout

Top to bottom (changes marked "new"):

```
[ All ]
─────────────
Bishopric
Clerks/Extended Bishopric
Young Men
Young Women
Sunday School
Relief Society
Elder's Quorum
Primary
Stake Callings
Misc
─────────────                   ← new separator
Bishop                          ← new
First Counselor                 ← new
Second Counselor                ← new
─────────────                   (existing separator)
Set Apart                       (master view only)
No Calling
```

## Role → org assignments

Each new entry is a `group` whose `slugs` array is exactly:

- **Bishop:** `priests-quorum`, `young-women-15-18`, `clerks-extended-bishopric`, `young-women`, `elders-quorum`, `relief-society`
- **First Counselor:** `teachers-quorum`, `young-women-13-14`, `sunday-school`, `emergency-prep`, `music`, `employment`, `single-adults`, `ward-history`, `friendship-meal-coordination`, `temple-prep`
- **Second Counselor:** `deacons-quorum`, `young-women-11-12`, `primary`, `building-maintenance`, `ward-activities`

`stake-callings`, the `bishopric` org itself, and the No Calling bucket are intentionally unassigned per the source list provided by the user.

All 21 slugs above are verified to match slugs already declared in the existing `SIDEBAR_ENTRIES` constant in [components/sidebar-filter.tsx](../../../components/sidebar-filter.tsx).

## Behavior

Identical to the existing `group` entries (Young Men, Young Women, Misc):

- **Click toggles all child slugs on/off as a unit.** Implemented by the existing `toggleEntry` function with no modification.
- **Count badge** = sum of `counts.get(orgId)` across the group's child orgs. Implemented by the existing `entryCount` function.
- **Active highlight** appears only when *every* child slug is currently in the filter set. Implemented by the existing `entryActive` function.
- **Stacks with other selections.** Clicking "Bishop" while a non-overlapping pill (e.g. "Primary") is already on simply unions the slug sets.
- **Overlap behavior** matches existing groups: if the user clicks "Bishop" (which includes `clerks-extended-bishopric`) and then later clicks the standalone "Clerks/Extended Bishopric" pill, that single slug is removed from the set, and "Bishop" drops out of the fully-active highlight because it no longer has *every* slug present. No new logic required.

## Implementation shape

1. Split the current flat `SIDEBAR_ENTRIES` constant into two arrays:
   - `MAIN_ENTRIES`: the existing 10 entries (Bishopric through Misc), unchanged in content and order.
   - `BISHOPRIC_ROLE_ENTRIES`: the 3 new entries, in the order Bishop → First Counselor → Second Counselor.
2. In the JSX render, replace the single `.map()` block with two consecutive blocks, each wrapped in `<div className="space-y-1">`, separated by `<div className="my-3 border-t border-black/10" />` (same divider markup already used before Set Apart).
3. No changes to `entryCount`, `entryActive`, `toggleEntry`, `entrySlugs`, `pillClass`, prop types, `FilterState`, `useFilterState`, or any consumer of `SidebarFilter`.

## Out of scope

- **Database storage of role → org assignments.** Static config in the component is the chosen storage per user decision.
- **Admin UI for editing assignments.** Edits happen in code.
- **Showing the bishopric member's name on each org header.** This is queued idea #1 in CLAUDE.md and requires a separate user → role data model. When that lands, the static role config in this spec should be replaced with a DB-driven version; this spec deliberately does not lay groundwork for it.
- **Restricting which users see the role tabs.** All authenticated users see them, same as every other sidebar pill today.
- **Persisting role-tab "active" state separately.** State is derived from `orgSlugs` membership, no new persistence.

## Acceptance criteria

- The sidebar shows the three new role tabs in the position and order specified.
- Two horizontal dividers are visible: one between Misc and Bishop, one between Second Counselor and Set Apart (master view) / No Calling (draft view).
- Clicking each role tab toggles its full slug set on or off and updates the count badge accordingly.
- The count badge on each role tab equals the sum of calling counts across that role's orgs.
- Selecting a role tab while individual orgs in its set are already selected highlights the tab as active. Deselecting any one of those orgs deactivates the tab highlight.
- No regression in existing sidebar entries (Young Men, Young Women, Misc, Set Apart, No Calling, All) or filter state persistence (localStorage key unchanged).
- Behavior is identical in master and draft views.

## Files touched

- [components/sidebar-filter.tsx](../../../components/sidebar-filter.tsx) — only file modified.
