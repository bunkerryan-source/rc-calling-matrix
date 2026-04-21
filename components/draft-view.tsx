'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { SidebarFilter } from './sidebar-filter';
import { OrgCard } from './org-card';
import { PersonChip } from './person-chip';
import { DragProvider, useDrag } from '@/lib/drag-context';
import type { FilterState } from '@/lib/filter-state';
import type { Calling, DraftAssignment, DraftStaging, MasterAssignment, Organization, Person } from '@/lib/types';
import { movePerson, unassign, setCalled, setSustained, setCommunicator, type Communicator } from '@/lib/data/drafts';
import { createClient } from '@/lib/supabase/client';
import { PromoteModal } from './promote-modal';
import { PresenceBadge } from './presence-badge';
import { Header } from './header';

function computeDiff({ organizations, callings, peopleById, masterAssignments, draftAssignments, staging }: {
  organizations: Organization[];
  callings: Calling[];
  peopleById: Map<string, Person>;
  masterAssignments: MasterAssignment[];
  draftAssignments: DraftAssignment[];
  staging: DraftStaging[];
}) {
  const stagedIds = new Set(staging.map((s) => s.person_id));
  const masterByCalling = new Map(masterAssignments.map((a) => [a.calling_id, a.person_id]));
  const draftByCalling = new Map(draftAssignments.map((a) => [a.calling_id, a.person_id]));
  const callingLabel = new Map<string, string>();
  const orgName = new Map(organizations.map((o) => [o.id, o.name]));
  for (const c of callings) callingLabel.set(c.id, `${orgName.get(c.organization_id) ?? ''} — ${c.title}`);
  type Row = { personId: string; was: string; now: string };
  const byPerson = new Map<string, Row>();
  const allCallingIds = new Set<string>([...masterByCalling.keys(), ...draftByCalling.keys()]);
  for (const cid of allCallingIds) {
    const mPid = masterByCalling.get(cid);
    const dPid = draftByCalling.get(cid);
    if (mPid === dPid) continue;
    if (mPid) {
      const nowCalling = [...draftByCalling.entries()].find(([, pid]) => pid === mPid)?.[0];
      const nowLabel = nowCalling ? callingLabel.get(nowCalling)! : (stagedIds.has(mPid) ? 'Staging' : 'Unassigned');
      byPerson.set(mPid, { personId: mPid, was: callingLabel.get(cid) ?? '—', now: nowLabel });
    }
    if (dPid) {
      if (byPerson.has(dPid)) continue;
      const wasCalling = [...masterByCalling.entries()].find(([, pid]) => pid === dPid)?.[0];
      const wasLabel = wasCalling ? callingLabel.get(wasCalling)! : 'Unassigned';
      byPerson.set(dPid, { personId: dPid, was: wasLabel, now: callingLabel.get(cid) ?? '—' });
    }
  }
  for (const pid of stagedIds) {
    if (byPerson.has(pid)) continue;
    const wasCalling = [...masterByCalling.entries()].find(([, p]) => p === pid)?.[0];
    const wasLabel = wasCalling ? callingLabel.get(wasCalling)! : 'Unassigned';
    byPerson.set(pid, { personId: pid, was: wasLabel, now: 'Staging' });
  }
  return [...byPerson.values()]
    .map((r) => ({ ...r, name: peopleById.get(r.personId)?.name ?? r.personId }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

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
  const [filter, setFilter] = useState<FilterState>({ all: true, orgSlugs: new Set(), setApart: false, noCalling: false });
  const [localAssign, setLocalAssign] = useState(draftAssignments);
  const [localStage, setLocalStage] = useState(staging);
  const [localCommunicator, setLocalCommunicator] = useState<Map<string, Communicator>>(
    () => new Map(communicators.map((c) => [c.person_id, c.role])),
  );
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [, startTransition] = useTransition();
  const drag = useDrag();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`draft:${draft.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_assignments', filter: `draft_id=eq.${draft.id}` }, async () => {
        const { data } = await supabase.from('draft_assignments')
          .select('draft_id, calling_id, person_id, called, sustained').eq('draft_id', draft.id);
        if (data) setLocalAssign(data);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_staging', filter: `draft_id=eq.${draft.id}` }, async () => {
        const { data } = await supabase.from('draft_staging')
          .select('draft_id, person_id').eq('draft_id', draft.id);
        if (data) setLocalStage(data);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_change_communicator', filter: `draft_id=eq.${draft.id}` }, async () => {
        const { data } = await supabase.from('draft_change_communicator')
          .select('person_id, role').eq('draft_id', draft.id);
        if (data) {
          setLocalCommunicator(new Map(data.map((r) => [r.person_id, r.role as Communicator])));
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [draft.id]);

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const callingsByOrg = useMemo(() => {
    const m = new Map<string, Calling[]>();
    for (const c of callings) { const l = m.get(c.organization_id) ?? []; l.push(c); m.set(c.organization_id, l); }
    return m;
  }, [callings]);

  const displayMap = useMemo(() =>
    new Map(localAssign.map((a) => [a.calling_id, { calling_id: a.calling_id, person_id: a.person_id, set_apart: false }])),
    [localAssign]);

  const draftMeta = useMemo(() => new Map(localAssign.map((a) => [a.calling_id, { called: a.called, sustained: a.sustained }])), [localAssign]);

  const assignedIds = useMemo(() => new Set(localAssign.map((a) => a.person_id)), [localAssign]);
  const stagedIds = useMemo(() => new Set(localStage.map((s) => s.person_id)), [localStage]);
  const unassignedPeople = useMemo(
    () => people.filter((p) => !assignedIds.has(p.id) && !stagedIds.has(p.id)),
    [people, assignedIds, stagedIds]
  );
  const stagedPeople = useMemo(
    () => localStage.map((s) => peopleById.get(s.person_id)).filter((p): p is Person => !!p),
    [localStage, peopleById]
  );

  const orgCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of organizations) m.set(o.id, (callingsByOrg.get(o.id) ?? []).length);
    return m;
  }, [organizations, callingsByOrg]);

  const visibleOrgs = filter.all
    ? organizations
    : organizations.filter((o) => filter.orgSlugs.has(o.slug));

  const diff = useMemo(() => computeDiff({
    organizations, callings, peopleById,
    masterAssignments, draftAssignments: localAssign, staging: localStage,
  }), [organizations, callings, peopleById, masterAssignments, localAssign, localStage]);

  function applyLocalMove(callingId: string, personId: string, fromCallingId: string | null) {
    setLocalAssign((prev) => {
      const next = prev.filter((a) => a.person_id !== personId);
      const displaced = next.find((a) => a.calling_id === callingId);
      const cleaned = next.filter((a) => a.calling_id !== callingId);
      cleaned.push({ draft_id: draft.id, calling_id: callingId, person_id: personId, called: false, sustained: false });
      if (displaced && displaced.person_id !== personId) {
        setLocalStage((s) => s.some((x) => x.person_id === displaced.person_id)
          ? s
          : [...s, { draft_id: draft.id, person_id: displaced.person_id }]);
      }
      return cleaned;
    });
    setLocalStage((s) => s.filter((x) => x.person_id !== personId));
  }

  async function onMove({ callingId, personId, fromCallingId }: { callingId: string; personId: string; fromCallingId: string | null; fromStaging: boolean }) {
    applyLocalMove(callingId, personId, fromCallingId);
    startTransition(async () => {
      try { await movePerson({ draftId: draft.id, callingId, personId }); }
      catch (err) { console.error('Move failed', err); alert('Move failed — reload the page.'); }
    });
  }

  async function onUnassignDropTarget(personId: string) {
    setLocalAssign((prev) => prev.filter((a) => a.person_id !== personId));
    setLocalStage((prev) => prev.filter((x) => x.person_id !== personId));
    startTransition(async () => {
      try { await unassign(draft.id, personId); }
      catch (err) { console.error('Unassign failed', err); }
    });
  }

  async function onToggleCalled(callingId: string, next: boolean) {
    setLocalAssign((prev) => prev.map((a) => a.calling_id === callingId ? { ...a, called: next } : a));
    startTransition(async () => { try { await setCalled(draft.id, callingId, next); } catch (e) { console.error(e); } });
  }
  async function onToggleSustained(callingId: string, next: boolean) {
    setLocalAssign((prev) => prev.map((a) => a.calling_id === callingId ? { ...a, sustained: next } : a));
    startTransition(async () => { try { await setSustained(draft.id, callingId, next); } catch (e) { console.error(e); } });
  }

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

  function onUnassignedAreaClick() {
    if (drag.active) { onUnassignDropTarget(drag.active.personId); drag.drop(); }
  }

  function onStagePickup(personId: string) {
    drag.pickup({ personId, fromCallingId: null, fromStaging: true });
  }

  function onUnassignedPickup(personId: string) {
    drag.pickup({ personId, fromCallingId: null, fromStaging: false });
  }

  return (
    <>
      <Header />
      <div className="md:flex md:min-h-[calc(100vh-3rem)]">
      <div className="md:sticky md:top-0 md:h-screen">
        <SidebarFilter userId={userId} organizations={organizations} counts={orgCounts}
                       noCallingCount={unassignedPeople.length} mode="draft" onChange={setFilter} />
      </div>
      <main className="flex-1">
        <div className="bg-draft text-white px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="font-numeric text-xs uppercase tracking-wider opacity-80">Draft</p>
            <h1 className="text-2xl">{draft.name}</h1>
            {drag.active && <p className="text-xs mt-1 opacity-90">Carrying: {peopleById.get(drag.active.personId)?.name} — tap a calling to place, or tap Members Without a Calling to unassign.</p>}
          </div>
          <div className="flex items-center gap-3">
            <PresenceBadge channelName={`presence:draft:${draft.id}`} userId={userId} />
            {!draft.archived && (
              <button onClick={() => setPromoteOpen(true)}
                      className="px-3 py-1.5 rounded bg-white text-draft font-medium">
                Promote
              </button>
            )}
          </div>
        </div>

        <section className="px-6 py-4 border-b border-black/10 bg-white">
          <h2 className="text-sm uppercase tracking-wide text-black/60 mb-2">Staging ({stagedPeople.length})</h2>
          <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
            {stagedPeople.length === 0
              ? <span className="text-sm italic text-black/40">No one in staging.</span>
              : stagedPeople.map((p) => (
                <PersonChip key={p.id} name={p.name}
                            selected={drag.active?.personId === p.id}
                            onPickup={() => onStagePickup(p.id)} />
              ))}
          </div>
        </section>

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

        <div className="px-6 py-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleOrgs.map((o) => (
            <OrgCard
              key={o.id}
              name={o.name}
              callings={callingsByOrg.get(o.id) ?? []}
              assignmentsByCallingId={displayMap}
              peopleById={peopleById}
              mode="draft"
              draftId={draft.id}
              draftMeta={draftMeta}
              onMove={onMove}
              onToggleCalled={onToggleCalled}
              onToggleSustained={onToggleSustained}
            />
          ))}
        </div>

        <section
          onClick={onUnassignedAreaClick}
          className={`mx-6 mb-10 bg-surface border rounded-lg p-4 ${drag.active ? 'border-draft cursor-copy' : 'border-black/10'}`}
        >
          <h2 className="text-lg text-primary mb-3">
            Members Without a Calling
            <span className="ml-2 text-xs font-numeric text-black/50">({unassignedPeople.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {unassignedPeople.map((p) => (
              <PersonChip key={p.id} name={p.name}
                          selected={drag.active?.personId === p.id}
                          onPickup={() => onUnassignedPickup(p.id)} />
            ))}
          </div>
        </section>
      </main>

      {promoteOpen && (
        <PromoteModal
          draftId={draft.id}
          draftName={draft.name}
          diff={diff.map(({ name, was, now }) => ({ name, was, now }))}
          onClose={() => setPromoteOpen(false)}
        />
      )}
      </div>
    </>
  );
}

const COMMUNICATOR_ROLES: ReadonlyArray<{ value: Communicator; label: string }> = [
  { value: 'bishop', label: 'B' },
  { value: 'first', label: '1st' },
  { value: 'second', label: '2nd' },
];

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
                  {COMMUNICATOR_ROLES.map(({ value, label }) => {
                    const active = current === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        aria-label={`Assign ${value === 'bishop' ? 'Bishop' : value === 'first' ? 'First Counselor' : 'Second Counselor'} as communicator for ${r.name}`}
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
