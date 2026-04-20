'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PersonChip } from './person-chip';
import { AddMemberModal } from './add-member-modal';
import type { Person } from '@/lib/types';

export function UnassignedSection({ people }: { people: Person[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-10 bg-surface border border-black/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg text-primary">
          Members Without a Calling
          <span className="ml-2 text-xs font-numeric text-black/50">({people.length})</span>
        </h2>
        <button onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1 text-sm px-2 py-1 border border-black/20 rounded hover:bg-white">
          <Plus className="w-4 h-4" /> Add member
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {people.map((p) => <PersonChip key={p.id} name={p.name} />)}
      </div>
      {open && <AddMemberModal onClose={() => setOpen(false)} />}
    </section>
  );
}
