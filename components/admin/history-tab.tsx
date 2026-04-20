'use client';

import { useEffect, useState } from 'react';
import { listPromotionHistory } from '@/lib/data/history';
import type { PromotionHistoryRow } from '@/lib/types';

export function HistoryTab() {
  const [rows, setRows] = useState<PromotionHistoryRow[]>([]);
  const [selected, setSelected] = useState<PromotionHistoryRow | null>(null);

  useEffect(() => { void listPromotionHistory().then(setRows); }, []);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <ul className="md:col-span-1 space-y-1">
        {rows.map((r) => (
          <li key={r.id}>
            <button onClick={() => setSelected(r)}
                    className={`w-full text-left p-2 rounded border ${selected?.id === r.id ? 'border-primary bg-primary/5' : 'border-black/10 hover:bg-black/5'}`}>
              <p className="font-medium">{r.draft_name}</p>
              <p className="text-xs text-black/50 font-numeric">{new Date(r.promoted_at).toLocaleString()}</p>
            </button>
          </li>
        ))}
        {rows.length === 0 && <p className="text-sm text-black/60">No promotions yet.</p>}
      </ul>
      <div className="md:col-span-2">
        {selected ? (
          <div className="bg-surface border border-black/10 rounded p-4">
            <h3 className="text-lg text-primary mb-3">{selected.draft_name}</h3>
            <p className="text-xs text-black/50 font-numeric mb-4">
              Promoted {new Date(selected.promoted_at).toLocaleString()}
            </p>
            <ul className="text-sm space-y-1 max-h-[60vh] overflow-y-auto">
              {selected.snapshot
                .sort((a, b) => (a.organization_name + a.calling_title).localeCompare(b.organization_name + b.calling_title))
                .map((s) => (
                  <li key={s.calling_id}>
                    <span className="text-black/50">{s.organization_name}</span>
                    <span className="text-black/30"> — </span>
                    <span>{s.calling_title}: </span>
                    <span className="font-medium">{s.person_name}</span>
                    {s.set_apart && <span className="ml-2 text-xs font-numeric text-primary">SA</span>}
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-black/60">Select a promotion to view its snapshot.</p>
        )}
      </div>
    </div>
  );
}
