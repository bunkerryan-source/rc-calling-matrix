'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listDrafts, createDraft, deleteDraft, renameDraft } from '@/lib/data/drafts';
import type { DraftRow } from '@/lib/types';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Header } from './header';

export function DraftsList() {
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  async function reload() { setRows(await listDrafts(showArchived)); }

  useEffect(() => { void reload(); }, [showArchived]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await createDraft(newName.trim());
    setNewName(''); setCreating(false);
    void reload();
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this draft?')) return;
    await deleteDraft(id); void reload();
  }

  async function onRename(row: DraftRow) {
    const n = prompt('Rename draft', row.name);
    if (!n || n === row.name) return;
    await renameDraft(row.id, n); void reload();
  }

  return (
    <>
    <Header />
    <main className="container mx-auto px-6 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl text-primary">Drafts</h1>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </header>

      {creating ? (
        <form onSubmit={onCreate} className="mb-6 flex gap-2">
          <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                 placeholder="Draft name"
                 className="flex-1 border border-black/20 rounded px-3 py-2" />
          <button type="submit" className="px-3 py-1.5 rounded bg-primary text-white">Create</button>
          <button type="button" onClick={() => { setCreating(false); setNewName(''); }}
                  className="px-3 py-1.5 rounded border border-black/20">Cancel</button>
        </form>
      ) : (
        <button onClick={() => setCreating(true)}
                className="mb-6 inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-white">
          <Plus className="w-4 h-4" /> New draft
        </button>
      )}

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id}
              className={`flex items-center justify-between gap-3 p-3 rounded border ${r.archived ? 'bg-black/5 border-black/10 text-black/60' : 'bg-surface border-black/10'}`}>
            <div className="flex-1 min-w-0">
              <Link href={`/drafts/${r.id}`} className="font-medium hover:underline">{r.name}</Link>
              <p className="text-xs text-black/50 font-numeric">
                Created {new Date(r.created_at).toLocaleString()}
                {r.archived && ' · Promoted'}
              </p>
            </div>
            {!r.archived && (
              <div className="flex gap-1">
                <button onClick={() => onRename(r)} aria-label="Rename"
                        className="p-1.5 rounded hover:bg-black/5"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => onDelete(r.id)} aria-label="Delete"
                        className="p-1.5 rounded hover:bg-red-50 text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </li>
        ))}
        {rows.length === 0 && <p className="text-sm text-black/60">No drafts yet.</p>}
      </ul>
    </main>
    </>
  );
}
