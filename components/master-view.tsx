'use client';

import { useState, useMemo, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { SidebarFilter } from './sidebar-filter';
import { OrgCard } from './org-card';
import { UnassignedSection } from './unassigned-section';
import { PresenceBadge } from './presence-badge';
import { createClient } from '@/lib/supabase/client';
import { WARD_ID } from '@/lib/types';
import type { FilterState } from '@/lib/filter-state';
import type { Calling, MasterAssignment, Organization, Person } from '@/lib/types';

export function MasterView(props: {
  userId: string | null;
  organizations: Organization[];
  callings: Calling[];
  people: Person[];
  assignments: MasterAssignment[];
}) {
  const { userId, organizations, callings } = props;
  const [people, setPeople] = useState(props.people);
  const [assignments, setAssignments] = useState(props.assignments);
  const [filter, setFilter] = useState<FilterState>({ all: true, orgSlugs: new Set(), setApart: false, noCalling: false });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('master')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_assignments' }, async () => {
        const { data } = await supabase.from('master_assignments').select('calling_id, person_id, set_apart');
        if (data) setAssignments(data);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'people' }, async () => {
        const { data } = await supabase.from('people').select('id, name, slug').eq('ward_id', WARD_ID).order('name');
        if (data) setPeople(data);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

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
    <div className="md:flex md:min-h-screen">
      <button
        aria-label="Toggle filter menu"
        className="md:hidden fixed top-3 left-3 z-40 bg-white border border-black/20 rounded p-2"
        onClick={() => setDrawerOpen((v) => !v)}
      >
        {drawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      <div className={`${drawerOpen ? 'block' : 'hidden'} md:block md:sticky md:top-0 md:h-screen`}>
        <SidebarFilter
          userId={userId}
          organizations={organizations}
          counts={orgCounts}
          noCallingCount={unassigned.length}
          mode="master"
          onChange={setFilter}
        />
      </div>

      <main className="flex-1 px-6 pt-16 pb-8 md:py-8">
        <header className="mb-8 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl text-primary">Calling Matrix — Rancho Carrillo Ward</h1>
            <p className="mt-2 text-sm text-black/60 font-numeric">
              {people.length} members · {assignments.length} assignments · {organizations.length} organizations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PresenceBadge channelName="presence:master" userId={userId} />
          </div>
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
