'use client';

import { useState, useMemo } from 'react';
import { SidebarFilter } from './sidebar-filter';
import { OrgCard } from './org-card';
import { UnassignedSection } from './unassigned-section';
import type { FilterState } from '@/lib/filter-state';
import type { Calling, MasterAssignment, Organization, Person } from '@/lib/types';

export function MasterView({
  userId, organizations, callings, people, assignments,
}: {
  userId: string | null;
  organizations: Organization[];
  callings: Calling[];
  people: Person[];
  assignments: MasterAssignment[];
}) {
  const [filter, setFilter] = useState<FilterState>({ all: true, orgSlugs: new Set(), setApart: false, noCalling: false });

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const assignmentsByCalling = useMemo(() => new Map(assignments.map((a) => [a.calling_id, a])), [assignments]);
  const callingsByOrg = useMemo(() => {
    const m = new Map<string, Calling[]>();
    for (const c of callings) {
      const list = m.get(c.organization_id) ?? [];
      list.push(c);
      m.set(c.organization_id, list);
    }
    return m;
  }, [callings]);
  const assignedIds = useMemo(() => new Set(assignments.map((a) => a.person_id)), [assignments]);
  const unassigned = useMemo(() => people.filter((p) => !assignedIds.has(p.id)), [people, assignedIds]);

  const orgCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of organizations) m.set(o.id, (callingsByOrg.get(o.id) ?? []).length);
    return m;
  }, [organizations, callingsByOrg]);

  // Apply filters to decide which orgs render and whether to show unassigned
  const showOrgs = !filter.noCalling; // noCalling hides orgs entirely
  const visibleOrgs = filter.all
    ? organizations
    : organizations.filter((o) => filter.orgSlugs.has(o.slug) || (filter.orgSlugs.size === 0 && !filter.noCalling));

  return (
    <div className="flex min-h-screen">
      <SidebarFilter
        userId={userId}
        organizations={organizations}
        counts={orgCounts}
        noCallingCount={unassigned.length}
        mode="master"
        onChange={setFilter}
      />
      <main className="flex-1 px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl text-primary">Calling Matrix — Rancho Carrillo Ward</h1>
          <p className="mt-2 text-sm text-black/60 font-numeric">
            {people.length} members · {assignments.length} assignments · {organizations.length} organizations
          </p>
        </header>

        {showOrgs && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleOrgs.map((o) => {
              const orgCallings = (callingsByOrg.get(o.id) ?? []).filter((c) => {
                if (!filter.setApart) return true;
                const a = assignmentsByCalling.get(c.id);
                return a && !a.set_apart;
              });
              if (filter.setApart && orgCallings.length === 0) return null;
              return (
                <OrgCard
                  key={o.id}
                  name={o.name}
                  callings={orgCallings}
                  assignmentsByCallingId={assignmentsByCalling}
                  peopleById={peopleById}
                  mode="master"
                />
              );
            })}
          </div>
        )}

        {(filter.all || filter.noCalling) && (
          <UnassignedSection people={unassigned} />
        )}
      </main>
    </div>
  );
}
