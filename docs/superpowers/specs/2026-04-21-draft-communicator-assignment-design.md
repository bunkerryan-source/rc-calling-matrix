---
title: Per-Change Communicator Assignment in Draft Diffs
date: 2026-04-21
status: approved
---

# Per-Change Communicator Assignment in Draft Diffs

## Goal

In the draft view's **Changes from Master** panel, let any draft viewer assign one of the three bishopric members — Bishop, First Counselor, Second Counselor — as the person responsible for talking to each impacted individual. Assignment is set with a three-pill toggle on each diff row, syncs in realtime across viewers, and lives only on the draft.

## Scope

- New table `draft_change_communicator` keyed `(draft_id, person_id)`.
- New three-pill toggle column on each diff row in `ChangesPanel` ([components/draft-view.tsx](../../../components/draft-view.tsx#L300)).
- New realtime subscription for the table.
- New helpers in [lib/data/drafts.ts](../../../lib/data/drafts.ts) and a third query in the draft detail page server component to fetch initial communicators.

No changes to `master_assignments`, `promote_draft`, `promotion_history`, the Promote modal, master view, history view, admin, or RLS pattern.

## Data model

```sql
create table draft_change_communicator (
  draft_id uuid references drafts(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  role text not null check (role in ('bishop','first','second')),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  primary key (draft_id, person_id)
);
```

RLS: enable RLS on the new table and apply the same blanket `is_authorized()` policies (`_s/_i/_u/_d`) used for every other application table. New migration follows the per-table-explicit pattern in [supabase/migrations/20260419120100_rls_policies.sql](../../../supabase/migrations/20260419120100_rls_policies.sql) — extend the array, do not refactor that file.

**Lifecycle.** The row exists only while the draft exists. `promote_draft` sets `drafts.archived = true` but does not delete the draft, so communicator rows survive promotion in the database. Reopening an archived draft would still show them. They vanish only when the draft itself is deleted (cascade), which is the existing "Delete draft" action in the drafts list. This is what "ephemeral" means in this spec: the data is never copied into master, never copied into `promotion_history.snapshot`, and never surfaced outside the draft view.

**Garbage collection: none.** If a person leaves the diff (e.g., a user reverts the change that put them there), their `draft_change_communicator` row stays. The diff doesn't render rows for people not currently impacted, so the stale row is invisible. If the same person re-enters the diff later, their prior role assignment reappears — a small but real UX win, and avoids client-side reconciliation logic that could race with realtime.

## UI

Append a three-pill toggle column to the right end of each `<li>` in `ChangesPanel`:

```
Jim Gamez    · Was: ... → Now: Staging              [ B ] [1st] [2nd]
Landon Cline · Was: ... → Now: ...                  [ B ] [1st] [2nd]
Tucker T.    · Was: ... → Now: ...                  [ B ] [1st] [2nd]
```

- Inactive pill: `bg-white text-black/60 border border-black/15`, hover `bg-black/5`.
- Active pill: `bg-draft text-white` — same accent the rest of the draft view uses.
- Pill text labels: `B`, `1st`, `2nd`.
- Pill sizing: `px-2 py-0.5 rounded text-xs`.
- Row layout: switch `<li>` from inline text to `flex items-center justify-between gap-2`. Diff text on the left, pill cluster on the right. On narrow screens the pill cluster wraps to its own line below the text — acceptable.
- The pill cluster is a plain `<div className="flex gap-1 shrink-0">` containing three `<button>` elements.

**Interaction.**

- Click an inactive pill → set role to that pill's value.
- Click the currently active pill → clear role (delete the row).
- Click a different inactive pill while another is active → swap (overwrite the role on the existing row).

All three actions are optimistic: client state updates immediately, server write goes through `startTransition`, and realtime reconciles. On error, log to console (matches the pattern used by `onMove` / `onUnassignDropTarget`) — no user-facing alert beyond what already exists. A failed write will be visually corrected by the realtime subscription on the next message.

## Data layer

In [lib/data/drafts.ts](../../../lib/data/drafts.ts):

```ts
export type Communicator = 'bishop' | 'first' | 'second';

export async function loadCommunicators(
  draftId: string
): Promise<Array<{ person_id: string; role: Communicator }>>;

export async function setCommunicator(
  draftId: string,
  personId: string,
  role: Communicator | null
): Promise<void>;
```

- `loadCommunicators`: `select person_id, role from draft_change_communicator where draft_id = $1`.
- `setCommunicator(..., null)`: `delete ... where draft_id = $1 and person_id = $2`.
- `setCommunicator(..., role)`: `upsert {draft_id, person_id, role, updated_at: now(), updated_by: auth.uid()}` on the composite key.

`loadDraftDetail` exists in `lib/data/drafts.ts` but is not currently called by the draft detail page (the page does inline queries). Do not modify `loadDraftDetail`.

## State plumbing

In `DraftViewInner` ([components/draft-view.tsx](../../../components/draft-view.tsx#L73)):

1. New prop `communicators: Array<{ person_id: string; role: Communicator }>` passed down from the page server component.
2. New local state `localCommunicator: Map<string, Communicator>` initialized from `communicators`.
3. New realtime subscription block in the existing `useEffect` for `draft_change_communicator filter=draft_id=eq.${draft.id}`. On `*` event, refetch the table and rebuild the map (same shape as the existing `draft_assignments` / `draft_staging` blocks).
4. New optimistic handler:
   ```ts
   async function onSetCommunicator(personId: string, role: Communicator | null) {
     setLocalCommunicator((prev) => {
       const next = new Map(prev);
       if (role === null) next.delete(personId);
       else next.set(personId, role);
       return next;
     });
     startTransition(async () => {
       try { await setCommunicator(draft.id, personId, role); }
       catch (err) { console.error('Set communicator failed', err); }
     });
   }
   ```
5. Pass `communicator={localCommunicator}` and `onSetCommunicator={onSetCommunicator}` into `<ChangesPanel>`.

`ChangesPanel` ([draft-view.tsx:300](../../../components/draft-view.tsx#L300)) gains two props and renders the pill cluster inside each `<li>`.

## Server loader

In [app/drafts/[id]/page.tsx](../../../app/drafts/%5Bid%5D/page.tsx), add a third entry to the existing `Promise.all([...])` block fetching `draft_change_communicator` rows for the draft, then pass the resulting array down as a new `communicators` prop on `<DraftView>`.

## Out of scope

- **Persistence into `promotion_history.snapshot`.** Per user decision, this is ephemeral.
- **Promote modal display.** The existing modal shows only calling change rows; communicator badges do not appear there.
- **Master view exposure.** Communicator assignment is purely a draft-coordination tool.
- **Auto-suggest based on the sidebar role mapping.** The static org→role config in [components/sidebar-filter.tsx](../../../components/sidebar-filter.tsx) is not consulted; users pick manually.
- **Per-org bishopric-member header (queued idea #1).** Deliberately separate. When that feature lands and moves the role mapping into the database, this feature continues to operate independently against its own table — no migration of this data needed.
- **Read-only role gating (queued idea #3).** Any draft viewer can set communicators for now, matching every other draft action.
- **History view enhancement (queued idea #5 / reports).** Out of scope.

## Acceptance criteria

- A three-pill toggle (B / 1st / 2nd) appears on every row in the draft's "Changes from Master" panel.
- Clicking an inactive pill assigns that role; clicking the active pill clears it; clicking another pill replaces the assignment.
- Assignments survive a page reload within the same draft.
- Two browsers viewing the same draft see each other's communicator changes in realtime within ~1 second.
- The Promote modal renders unchanged: no badges, no extra columns, no copy changes.
- Promoting a draft does not write any communicator data into `master_assignments` or `promotion_history`.
- Deleting a draft removes all of that draft's communicator rows (cascade verified by select-after-delete in manual QA).
- The existing diff display is otherwise unchanged: same row text, same sort order, same `text-draft font-medium` styling on the "Staging" label.
- The communicator subscription does not interfere with the existing `draft_assignments` or `draft_staging` subscriptions: editing assignments still updates the diff, and the diff still recomputes correctly.

## Files touched

- **New:** `supabase/migrations/20260421120000_draft_change_communicator.sql` — table, RLS enable, four blanket policies.
- **Modified:** [lib/data/drafts.ts](../../../lib/data/drafts.ts) — `Communicator` type, `loadCommunicators`, `setCommunicator`.
- **Modified:** [components/draft-view.tsx](../../../components/draft-view.tsx) — new prop, local state, subscription, handler, and pill cluster in `ChangesPanel`.
- **Modified:** [app/drafts/[id]/page.tsx](../../../app/drafts/%5Bid%5D/page.tsx) — add a third query alongside the existing draft assignments / staging fetches; pass `communicators` to `<DraftView>`.
