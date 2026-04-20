'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { deletePerson, renamePerson } from '@/lib/data/people';
import { WARD_ID } from '@/lib/types';
import type { Person } from '@/lib/types';

export function PeopleTab() {
  const [rows, setRows] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignmentCountById, setAssignmentCountById] = useState<Map<string, { master: number; drafts: number }>>(new Map());

  async function reload() {
    setLoading(true);
    const supabase = createClient();
    const [peopleRes, masterRes, draftRes] = await Promise.all([
      supabase.from('people').select('id, name, slug').eq('ward_id', WARD_ID).order('name'),
      supabase.from('master_assignments').select('person_id'),
      supabase.from('draft_assignments').select('person_id'),
    ]);
    const counts = new Map<string, { master: number; drafts: number }>();
    for (const m of masterRes.data ?? []) {
      const c = counts.get(m.person_id) ?? { master: 0, drafts: 0 };
      c.master++; counts.set(m.person_id, c);
    }
    for (const d of draftRes.data ?? []) {
      const c = counts.get(d.person_id) ?? { master: 0, drafts: 0 };
      c.drafts++; counts.set(d.person_id, c);
    }
    setRows(peopleRes.data ?? []);
    setAssignmentCountById(counts);
    setLoading(false);
  }

  useEffect(() => { void reload(); }, []);

  async function onRename(row: Person) {
    const n = prompt('Rename member', row.name);
    if (!n || n === row.name) return;
    await renamePerson(row.id, n); void reload();
  }

  async function onDelete(row: Person) {
    const c = assignmentCountById.get(row.id) ?? { master: 0, drafts: 0 };
    const warning = c.master || c.drafts
      ? `This will remove ${row.name} from ${c.master} master calling(s) and ${c.drafts} draft assignment(s). History in Promotion History is preserved. Continue?`
      : `Delete ${row.name}?`;
    if (!confirm(warning)) return;
    await deletePerson(row.id); void reload();
  }

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <input type="text" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)}
             className="mb-4 w-full max-w-sm border border-black/20 rounded px-3 py-2" />
      {loading ? <p className="text-sm text-black/60">Loading…</p> : (
        <ul className="space-y-1">
          {filtered.map((r) => {
            const c = assignmentCountById.get(r.id) ?? { master: 0, drafts: 0 };
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 py-1 border-b border-black/5">
                <div>
                  <span>{r.name}</span>
                  <span className="ml-2 text-xs text-black/50 font-numeric">
                    master: {c.master} · drafts: {c.drafts}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onRename(r)} className="text-sm text-primary">Rename</button>
                  <button onClick={() => onDelete(r)} className="text-sm text-red-700">Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
