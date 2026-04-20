'use client';

import { useMemo, useState } from 'react';
import { SidebarFilter } from './sidebar-filter';
import { OrgCard } from './org-card';
import { PersonChip } from './person-chip';
import type { FilterState } from '@/lib/filter-state';
import type { Calling, DraftAssignment, DraftStaging, MasterAssignment, Organization, Person } from '@/lib/types';

export function DraftView({
  userId, draft, masterAssignments, organizations, callings, people, draftAssignments, staging,
}: {
  userId: string | null;
  draft: { id: string; name: string; archived: boolean };
  masterAssignments: MasterAssignment[];
  organizations: Organization[];
  callings: Calling[];
  people: Person[];
  draftAssignments: DraftAssignment[];
  staging: DraftStaging[];
}) {
  const [filter, setFilter] = useState<FilterState>({ all: true, orgSlugs: new Set(), setApart: false, noCalling: false });

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const draftAssignByCalling = useMemo(() => new Map(draftAssignments.map((a) => [a.calling_id, a])), [draftAssignments]);
  const masterAssignByCalling = useMemo(() => new Map(masterAssignments.map((a) => [a.calling_id, a])), [masterAssignments]);
  const callingsByOrg = useMemo(() => {
    const m = new Map<string, Calling[]>();
    for (const c of callings) { const l = m.get(c.organization_id) ?? []; l.push(c); m.set(c.organization_id, l); }
    return m;
  }, [callings]);
  const assignedIds = useMemo(() => new Set(draftAssignments.map((a) => a.person_id)), [draftAssignments]);
  const stagedIds = useMemo(() => new Set(staging.map((s) => s.person_id)), [staging]);
  const unassigned = useMemo(
    () => people.filter((p) => !assignedIds.has(p.id) && !stagedIds.has(p.id)),
    [people, assignedIds, stagedIds]
  );
  const stagedPeople = useMemo(
    () => staging.map((s) => peopleById.get(s.person_id)!).filter(Boolean),
    [staging, peopleById]
  );

  const orgCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of organizations) m.set(o.id, (callingsByOrg.get(o.id) ?? []).length);
    return m;
  }, [organizations, callingsByOrg]);

  const visibleOrgs = filter.all
    ? organizations
    : organizations.filter((o) => filter.orgSlugs.has(o.slug));

  // Assignments-for-display: use draft values
  const displayAssignments = useMemo(
    () => draftAssignments.map((a) => ({ calling_id: a.calling_id, person_id: a.person_id, set_apart: false })),
    [draftAssignments]
  );
  const displayMap = useMemo(() => new Map(displayAssignments.map((a) => [a.calling_id, a])), [displayAssignments]);

  return (
    <div className="md:flex md:min-h-screen">
      <div className="md:sticky md:top-0 md:h-screen">
        <SidebarFilter userId={userId} organizations={organizations} counts={orgCounts}
                       noCallingCount={unassigned.length} mode="draft" onChange={setFilter} />
      </div>
      <main className="flex-1">
        <div className="bg-draft text-white px-6 py-3">
          <p className="font-numeric text-xs uppercase tracking-wider opacity-80">Draft</p>
          <h1 className="text-2xl">{draft.name}</h1>
        </div>

        <section className="px-6 py-4 border-b border-black/10 bg-white">
          <h2 className="text-sm uppercase tracking-wide text-black/60 mb-2">Staging ({stagedPeople.length})</h2>
          <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
            {stagedPeople.length === 0
              ? <span className="text-sm italic text-black/40">No one in staging.</span>
              : stagedPeople.map((p) => <PersonChip key={p.id} name={p.name} />)}
          </div>
        </section>

        <section className="px-6 py-4 border-b border-black/10 bg-surface">
          <h2 className="text-sm uppercase tracking-wide text-black/60 mb-2">Changes from Master</h2>
          <p className="text-sm text-black/60">[populated in a later task]</p>
        </section>

        <div className="px-6 py-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleOrgs.map((o) => (
            <OrgCard key={o.id} name={o.name}
                     callings={callingsByOrg.get(o.id) ?? []}
                     assignmentsByCallingId={displayMap}
                     peopleById={peopleById}
                     mode="draft" />
          ))}
        </div>

        <section className="mx-6 mb-10 bg-surface border border-black/10 rounded-lg p-4">
          <h2 className="text-lg text-primary mb-3">
            Members Without a Calling
            <span className="ml-2 text-xs font-numeric text-black/50">({unassigned.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((p) => <PersonChip key={p.id} name={p.name} />)}
          </div>
        </section>
      </main>
    </div>
  );
}
