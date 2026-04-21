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
