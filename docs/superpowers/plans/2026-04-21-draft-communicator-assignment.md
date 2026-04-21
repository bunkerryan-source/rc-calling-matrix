# Per-Change Communicator Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-pill (B / 1st / 2nd) communicator-assignment toggle to each row in the draft "Changes from Master" panel, persisted in a new `draft_change_communicator` table and synced via Supabase realtime.

**Architecture:** New table keyed `(draft_id, person_id)` with the same blanket RLS as every other application table. Server component for `/drafts/[id]` fetches initial rows alongside assignments and staging. Client `DraftViewInner` adds local-state-with-realtime for the new map and passes it (plus a setter) into `ChangesPanel`, which renders three pill buttons per diff row. No changes to `master_assignments`, `promote_draft`, `promotion_history`, or the Promote modal.

**Tech Stack:** Next.js 16 App Router · React 19 · Tailwind v3 · Supabase (`@supabase/supabase-js`, `@supabase/ssr`, `postgres_changes` realtime) · TypeScript strict + `noUncheckedIndexedAccess`.

**Spec:** [docs/superpowers/specs/2026-04-21-draft-communicator-assignment-design.md](../specs/2026-04-21-draft-communicator-assignment-design.md)

**Conventions for this project (from CLAUDE.md):**
- Manual QA only — no Jest/Vitest. Verify with `npm run build` (type + lint) and `npm run dev` smoke check.
- Commit per task. Imperative commit messages. **No Claude trailer.**
- Migrations applied via the Supabase MCP (`mcp__claude_ai_Supabase__apply_migration`) on project ID `rhdcjakrotxeeacuwgmp`.
- Push to `origin/main` triggers a Vercel auto-deploy. Smoke check production after the final task.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `supabase/migrations/20260421120000_draft_change_communicator.sql` | **Create** | Table + 4 RLS policies |
| `lib/data/drafts.ts` | Modify | Add `Communicator` type, `loadCommunicators`, `setCommunicator` |
| `app/drafts/[id]/page.tsx` | Modify | Add third query + pass `communicators` prop |
| `components/draft-view.tsx` | Modify | New prop, local state, realtime subscription, optimistic handler, pill cluster in `ChangesPanel` |
| `CLAUDE.md` | Modify | Append session 5 notes |

---

## Task 1: Database migration — `draft_change_communicator` table

**Files:**
- Create: `supabase/migrations/20260421120000_draft_change_communicator.sql`

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260421120000_draft_change_communicator.sql` with this exact content:

```sql
-- Per-change communicator assignment for draft diffs.
-- Ephemeral to the draft: never copied into master or promotion_history.
-- Cascades when the draft (or person) is deleted.

create table draft_change_communicator (
  draft_id uuid references drafts(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  role text not null check (role in ('bishop','first','second')),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  primary key (draft_id, person_id)
);

alter table draft_change_communicator enable row level security;

create policy draft_change_communicator_s on draft_change_communicator
  for select using (is_authorized());
create policy draft_change_communicator_i on draft_change_communicator
  for insert with check (is_authorized());
create policy draft_change_communicator_u on draft_change_communicator
  for update using (is_authorized()) with check (is_authorized());
create policy draft_change_communicator_d on draft_change_communicator
  for delete using (is_authorized());
```

- [ ] **Step 2: Apply the migration via the Supabase MCP**

Call `mcp__claude_ai_Supabase__apply_migration` with:
- `project_id`: `rhdcjakrotxeeacuwgmp`
- `name`: `draft_change_communicator`
- `query`: the full SQL from Step 1

Expected: success response with no error.

- [ ] **Step 3: Verify the table exists with correct policies**

Call `mcp__claude_ai_Supabase__execute_sql` with:
- `project_id`: `rhdcjakrotxeeacuwgmp`
- `query`:

```sql
select tablename, rowsecurity from pg_tables where tablename = 'draft_change_communicator';
select polname from pg_policy where polrelid = 'draft_change_communicator'::regclass order by polname;
```

Expected output:
- First query: one row, `rowsecurity = true`.
- Second query: four rows — `draft_change_communicator_d`, `draft_change_communicator_i`, `draft_change_communicator_s`, `draft_change_communicator_u`.

- [ ] **Step 4: Commit and push**

```bash
git add supabase/migrations/20260421120000_draft_change_communicator.sql
git commit -m "Add draft_change_communicator table with RLS"
git push
```

---

## Task 2: Data layer + server fetch + client wiring + UI

**Files:**
- Modify: `lib/data/drafts.ts`
- Modify: `app/drafts/[id]/page.tsx`
- Modify: `components/draft-view.tsx`

This task is one cohesive change because the prop `communicators` flows from the server component through `<DraftView>` to `<DraftViewInner>` to `<ChangesPanel>` and would not type-check at intermediate states.

- [ ] **Step 1: Add `Communicator` type and helpers in `lib/data/drafts.ts`**

Append the following to the END of `lib/data/drafts.ts` (after `setSustained`):

```ts
export type Communicator = 'bishop' | 'first' | 'second';

export async function loadCommunicators(
  draftId: string,
): Promise<Array<{ person_id: string; role: Communicator }>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('draft_change_communicator')
    .select('person_id, role')
    .eq('draft_id', draftId);
  if (error) throw error;
  return (data ?? []) as Array<{ person_id: string; role: Communicator }>;
}

export async function setCommunicator(
  draftId: string,
  personId: string,
  role: Communicator | null,
): Promise<void> {
  const supabase = createClient();
  if (role === null) {
    const { error } = await supabase
      .from('draft_change_communicator')
      .delete()
      .eq('draft_id', draftId)
      .eq('person_id', personId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('draft_change_communicator')
    .upsert({
      draft_id: draftId,
      person_id: personId,
      role,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}
```

- [ ] **Step 2: Add the third query in `app/drafts/[id]/page.tsx`**

Locate the `Promise.all` block (currently 2 entries) and replace it.

Find this block:

```tsx
  const [assignRes, stageRes] = await Promise.all([
    supabase.from('draft_assignments').select('draft_id, calling_id, person_id, called, sustained').eq('draft_id', id),
    supabase.from('draft_staging').select('draft_id, person_id').eq('draft_id', id),
  ]);
```

Replace with:

```tsx
  const [assignRes, stageRes, commRes] = await Promise.all([
    supabase.from('draft_assignments').select('draft_id, calling_id, person_id, called, sustained').eq('draft_id', id),
    supabase.from('draft_staging').select('draft_id, person_id').eq('draft_id', id),
    supabase.from('draft_change_communicator').select('person_id, role').eq('draft_id', id),
  ]);
```

Then in the `<DraftView ... />` JSX further down, add `communicators` as a new prop. Find:

```tsx
      draftAssignments={assignRes.data ?? []}
      staging={stageRes.data ?? []}
    />
```

Replace with:

```tsx
      draftAssignments={assignRes.data ?? []}
      staging={stageRes.data ?? []}
      communicators={(commRes.data ?? []) as Array<{ person_id: string; role: 'bishop' | 'first' | 'second' }>}
    />
```

- [ ] **Step 3: Add the import + prop + state + subscription + handler in `components/draft-view.tsx`**

In `components/draft-view.tsx`:

**3a. Update the import on line 10** from:

```tsx
import { movePerson, unassign, setCalled, setSustained } from '@/lib/data/drafts';
```

to:

```tsx
import { movePerson, unassign, setCalled, setSustained, setCommunicator, type Communicator } from '@/lib/data/drafts';
```

**3b. Add `communicators` to the outer `DraftView` props.** Find the props object on the `DraftView` function (lines 60-69) and add `communicators` to both the destructured spread and the type:

```tsx
export function DraftView(props: {
  userId: string | null;
  draft: { id: string; name: string; archived: boolean };
  masterAssignments: MasterAssignment[];
  organizations: Organization[];
  callings: Calling[];
  people: Person[];
  draftAssignments: DraftAssignment[];
  staging: DraftStaging[];
  communicators: Array<{ person_id: string; role: Communicator }>;
}) {
  return <DragProvider><DraftViewInner {...props} /></DragProvider>;
}
```

**3c. Add `communicators` to the inner `DraftViewInner` props (lines 73-84).** Update both the destructure list and the type signature:

```tsx
function DraftViewInner({
  userId, draft, masterAssignments, organizations, callings, people, draftAssignments, staging, communicators,
}: {
  userId: string | null;
  draft: { id: string; name: string; archived: boolean };
  masterAssignments: MasterAssignment[];
  organizations: Organization[];
  callings: Calling[];
  people: Person[];
  draftAssignments: DraftAssignment[];
  staging: DraftStaging[];
  communicators: Array<{ person_id: string; role: Communicator }>;
}) {
```

**3d. Add `localCommunicator` state.** Just below the `const [localStage, setLocalStage] = useState(staging);` line (~line 87), add:

```tsx
  const [localCommunicator, setLocalCommunicator] = useState<Map<string, Communicator>>(
    () => new Map(communicators.map((c) => [c.person_id, c.role])),
  );
```

**3e. Add the realtime subscription block.** In the existing `useEffect` (lines 92-108), add a third `.on('postgres_changes', ...)` chain. The current block ends with:

```tsx
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_staging', filter: `draft_id=eq.${draft.id}` }, async () => {
        const { data } = await supabase.from('draft_staging')
          .select('draft_id, person_id').eq('draft_id', draft.id);
        if (data) setLocalStage(data);
      })
      .subscribe();
```

Insert a third `.on(...)` block BEFORE `.subscribe()`:

```tsx
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_change_communicator', filter: `draft_id=eq.${draft.id}` }, async () => {
        const { data } = await supabase.from('draft_change_communicator')
          .select('person_id, role').eq('draft_id', draft.id);
        if (data) {
          setLocalCommunicator(new Map(data.map((r) => [r.person_id, r.role as Communicator])));
        }
      })
```

So the subscription chain reads: `draft_assignments` → `draft_staging` → `draft_change_communicator` → `.subscribe()`.

**3f. Add the optimistic handler.** Below the existing `onToggleSustained` function (~line 188), add:

```tsx
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

**3g. Pass the new props into `<ChangesPanel>` (lines 242-249).** Replace:

```tsx
        <ChangesPanel
          organizations={organizations}
          callings={callings}
          peopleById={peopleById}
          masterAssignments={masterAssignments}
          draftAssignments={localAssign}
          staging={localStage}
        />
```

with:

```tsx
        <ChangesPanel
          organizations={organizations}
          callings={callings}
          peopleById={peopleById}
          masterAssignments={masterAssignments}
          draftAssignments={localAssign}
          staging={localStage}
          communicator={localCommunicator}
          onSetCommunicator={onSetCommunicator}
        />
```

- [ ] **Step 4: Update the `ChangesPanel` component to render the pill cluster**

In `components/draft-view.tsx`, replace the entire `ChangesPanel` function (currently lines 300-334) with:

```tsx
function ChangesPanel({
  organizations, callings, peopleById, masterAssignments, draftAssignments, staging,
  communicator, onSetCommunicator,
}: {
  organizations: Organization[];
  callings: Calling[];
  peopleById: Map<string, Person>;
  masterAssignments: MasterAssignment[];
  draftAssignments: DraftAssignment[];
  staging: DraftStaging[];
  communicator: Map<string, Communicator>;
  onSetCommunicator: (personId: string, role: Communicator | null) => void;
}) {
  const rows = computeDiff({ organizations, callings, peopleById, masterAssignments, draftAssignments, staging });
  const ROLES: ReadonlyArray<{ value: Communicator; label: string }> = [
    { value: 'bishop', label: 'B' },
    { value: 'first', label: '1st' },
    { value: 'second', label: '2nd' },
  ];

  return (
    <section className="px-6 py-4 border-b border-black/10 bg-surface">
      <h2 className="text-sm uppercase tracking-wide text-black/60 mb-2">
        Changes from Master ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm italic text-black/40">No changes yet.</p>
      ) : (
        <ul className="text-sm space-y-1">
          {rows.map((r) => {
            const current = communicator.get(r.personId) ?? null;
            return (
              <li key={r.personId} className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="font-medium">{r.name}</span>
                  <span className="text-black/50"> · Was: </span>
                  <span>{r.was}</span>
                  <span className="text-black/50"> → Now: </span>
                  <span className={r.now === 'Staging' ? 'text-draft font-medium' : ''}>{r.now}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  {ROLES.map(({ value, label }) => {
                    const active = current === value;
                    return (
                      <button
                        key={value}
                        onClick={() => onSetCommunicator(r.personId, active ? null : value)}
                        className={`px-2 py-0.5 rounded text-xs ${active
                          ? 'bg-draft text-white'
                          : 'bg-white text-black/60 border border-black/15 hover:bg-black/5'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Build to verify the type-check passes**

Run:

```bash
npm run build
```

Expected: Build succeeds. No TypeScript errors. No ESLint errors.

If the build fails, read the error and fix before continuing. Common failure modes:
- Missing import of `Communicator` → re-check Step 3a.
- `setLocalCommunicator` referenced before declared → re-check ordering of Step 3d.
- Type mismatch on `r.role as Communicator` cast in subscription → confirm the column type returned by Supabase matches the union.

- [ ] **Step 6: Manual smoke check against `npm run dev`**

```bash
npm run dev
```

Open `http://localhost:3000` and sign in. Then:

1. Open an existing draft (or create a new one) at `/drafts/<id>`.
2. Move at least one person between callings so the diff has rows.
3. Verify each row shows three small pills `[ B ] [1st] [2nd]` at the right end.
4. Click the `B` pill on a row — it should highlight in the draft accent (gold/amber).
5. Click `1st` on the same row — `B` deactivates, `1st` activates.
6. Click `1st` again — pill deactivates, no role assigned.
7. Reload the page — your last-set assignments should still be visible.
8. Open the same draft in a second browser tab, click a pill in tab A, and verify tab B updates within ~1 second.
9. Open the Promote modal — confirm the diff list inside it shows **no** pill column and **no** role badges (out of scope per spec).
10. Without promoting, close the modal.

If any step fails, debug and fix in this task before committing.

- [ ] **Step 7: Commit and push**

```bash
git add lib/data/drafts.ts app/drafts/[id]/page.tsx components/draft-view.tsx
git commit -m "Add per-change communicator assignment toggle in draft diff"
git push
```

Vercel will auto-deploy. Wait for the deploy to land (~2 minutes), then quickly repeat smoke steps 1-6 against `https://rccallingmatrix.vercel.app` to confirm the production build behaves the same.

---

## Task 3: Update CLAUDE.md with session notes

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Bump the Status line and append a session 5 paragraph**

In `CLAUDE.md`, find the Status line near the top (currently reads `**Status (as of 2026-04-21, end of session 4)**`) and update it to `**Status (as of 2026-04-21, end of session 5)**`.

In the same Status section, append a sentence to the existing paragraph that mentions session 4. The current paragraph ends with: `Session 4 added Bishop / 1st Counselor / 2nd Counselor sidebar role tabs.` — add at the end: ` Session 5 added the per-change communicator assignment (B / 1st / 2nd toggle) on each row in a draft's Changes from Master panel.`

- [ ] **Step 2: Add a new `## Session 5 — Communicator assignment` section**

In `CLAUDE.md`, locate the heading `## Workflow conventions`. Immediately ABOVE that heading, insert this new section:

```markdown
## Session 5 — Communicator assignment

- **Per-change communicator toggle.** Each row in the draft "Changes from Master" panel gets three small pill buttons — `B`, `1st`, `2nd` — assigning a bishopric member to follow up with that person. Click an inactive pill to set; click the active pill to clear; click a different pill to swap. State lives in a new `draft_change_communicator` table keyed `(draft_id, person_id)` with the same blanket RLS as every other table. Realtime via a third `postgres_changes` subscription in `DraftViewInner`. Spec: [docs/superpowers/specs/2026-04-21-draft-communicator-assignment-design.md](docs/superpowers/specs/2026-04-21-draft-communicator-assignment-design.md). Migration: `supabase/migrations/20260421120000_draft_change_communicator.sql`.
- **Ephemeral by design.** The communicator assignment is never copied into `master_assignments` or `promotion_history.snapshot`, and is not shown in the Promote modal or the History view. The rows live on the draft and cascade-delete when the draft is deleted. Promotion archives the draft (existing behavior) but does not delete its communicator rows — they remain visible if the archived draft is reopened.
- **Garbage collection: none.** When a person leaves the diff (e.g., a user reverts the change that put them there), their communicator row stays in the table but renders nowhere. If they re-enter the diff later, their prior role reappears.
- **Update the queued-ideas list.** Idea #2 ("Per-change communicator assignment in draft diffs") is now done — strike it from the list or move it to a "shipped" subsection.
```

- [ ] **Step 3: Commit and push**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md: session 5 communicator assignment notes"
git push
```

---

## Spec coverage check

| Spec section | Implemented in |
|---|---|
| Goal | Tasks 1, 2 |
| Data model (table + RLS) | Task 1 |
| UI (three pills, active/inactive, click-to-clear, swap) | Task 2 Step 4 |
| Data layer (`Communicator`, `loadCommunicators`, `setCommunicator`) | Task 2 Step 1 |
| State plumbing (prop + local state + subscription + handler) | Task 2 Step 3 |
| Server loader (third query in `app/drafts/[id]/page.tsx`) | Task 2 Step 2 |
| Out-of-scope guarantees (no Promote modal change, no history change) | Verified in Task 2 Step 6 (smoke step 9) |
| Acceptance criteria | Task 2 Step 6 |

No gaps.
