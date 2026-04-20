'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addPerson } from '@/lib/data/people';

export function AddMemberModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true); setError(null);
    try {
      await addPerson(name.trim());
      router.refresh();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6" onClick={onClose}>
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-sm border border-black/10">
        <h2 className="text-lg text-primary mb-4">Add member</h2>
        <label className="block text-sm mb-2">Full name</label>
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} autoFocus
               className="w-full border border-black/20 rounded px-3 py-2 mb-4" />
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
                  className="px-3 py-1.5 rounded border border-black/20">Cancel</button>
          <button type="submit" disabled={submitting}
                  className="px-3 py-1.5 rounded bg-primary text-white disabled:opacity-60">
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}
