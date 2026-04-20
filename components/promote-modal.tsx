'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { promoteDraft } from '@/lib/data/drafts';

interface DiffRow { name: string; was: string; now: string; }

export function PromoteModal({
  draftId, draftName, diff, onClose,
}: {
  draftId: string;
  draftName: string;
  diff: DiffRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [typed, setTyped] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const match = typed.trim() === draftName;

  async function onPromote() {
    setSubmitting(true); setError(null);
    try {
      await promoteDraft(draftId);
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-black/10">
        <h2 className="text-xl text-primary mb-1">Promote draft</h2>
        <p className="text-sm text-black/70 mb-4">
          This will replace master with <strong>{diff.length}</strong> {diff.length === 1 ? 'change' : 'changes'}. Set Apart
          status is preserved only where the assigned person didn't change.
        </p>
        {diff.length === 0 ? (
          <p className="italic text-black/60 mb-4">No changes from master. Nothing will happen.</p>
        ) : (
          <ul className="text-sm space-y-1 mb-4 max-h-64 overflow-y-auto bg-surface rounded p-3 border border-black/10">
            {diff.map((r) => (
              <li key={r.name}>
                <span className="font-medium">{r.name}</span>
                <span className="text-black/50"> · Was: </span>{r.was}
                <span className="text-black/50"> → Now: </span>
                <span className={r.now === 'Unassigned' ? 'text-black/50' : ''}>{r.now}</span>
              </li>
            ))}
          </ul>
        )}
        <label className="block text-sm mb-2">
          Type the draft name (<code className="font-numeric">{draftName}</code>) to confirm:
        </label>
        <input type="text" value={typed} onChange={(e) => setTyped(e.target.value)}
               className="w-full border border-black/20 rounded px-3 py-2 mb-4" />
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded border border-black/20">Cancel</button>
          <button onClick={onPromote} disabled={!match || submitting || diff.length === 0}
                  className="px-3 py-1.5 rounded bg-primary text-white disabled:opacity-40">
            {submitting ? 'Promoting…' : 'Promote'}
          </button>
        </div>
      </div>
    </div>
  );
}
