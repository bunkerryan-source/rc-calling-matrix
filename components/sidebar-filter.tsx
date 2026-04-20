'use client';

import { useFilterState, type FilterState } from '@/lib/filter-state';
import type { Organization } from '@/lib/types';
import { titleCase } from '@/lib/utils/title-case';

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

  function commit(next: FilterState) { save(next); onChange(next); }

  function toggleOrg(slug: string) {
    const next = { ...state, all: false, orgSlugs: new Set(state.orgSlugs) };
    if (next.orgSlugs.has(slug)) next.orgSlugs.delete(slug); else next.orgSlugs.add(slug);
    if (next.orgSlugs.size === 0 && !next.setApart && !next.noCalling) next.all = true;
    commit(next);
  }

  const accent = mode === 'draft' ? 'bg-draft text-white' : 'bg-primary text-white';
  const unselected = 'bg-white text-black/80 hover:bg-black/5';

  function pillClass(active: boolean) {
    return `w-full text-left px-3 py-1.5 rounded text-sm flex items-center justify-between ${active ? accent : unselected}`;
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
        {organizations.map((o) => {
          const active = state.orgSlugs.has(o.slug);
          return (
            <button key={o.id} className={pillClass(active)} onClick={() => toggleOrg(o.slug)}>
              <span>{titleCase(o.name)}</span>
              <span className="font-numeric text-xs opacity-70">{counts.get(o.id) ?? 0}</span>
            </button>
          );
        })}
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
