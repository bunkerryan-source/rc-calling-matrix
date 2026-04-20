'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Row {
  user_id: string;
  ward_id: string;
  display_name: string | null;
  granted_at: string;
  email: string | null;
  must_change_password: boolean;
}

export function UsersTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('admin_list_user_access');
    if (error) { setError(error.message); setLoading(false); return; }
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => { void reload(); }, []);

  async function onGrant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const target = email.trim();
    if (!target) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc('admin_grant_access', {
      target_email: target,
      display_name: displayName.trim() || null,
    });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setEmail(''); setDisplayName('');
    void reload();
  }

  async function onRemove(userId: string, label: string) {
    if (!confirm(`Remove access for ${label}? They will be signed out on their next page load.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('user_access').delete().eq('user_id', userId);
    if (error) { alert(error.message); return; }
    void reload();
  }

  return (
    <div>
      <p className="text-sm text-black/70 mb-4">
        First create the user in the Supabase dashboard (Authentication → Users → Create new user).
        Then paste their email below to grant ward access. Removing access here does not delete the auth user.
      </p>

      <form onSubmit={onGrant} className="mb-6 flex flex-wrap gap-2 items-end bg-surface border border-black/10 rounded p-3">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs uppercase tracking-wide text-black/50 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="newperson@example.com"
            className="w-full border border-black/20 rounded px-3 py-2"
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs uppercase tracking-wide text-black/50 mb-1">Display name (optional)</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Matt Brown"
            className="w-full border border-black/20 rounded px-3 py-2"
          />
        </div>
        <button type="submit" disabled={submitting}
                className="px-4 py-2 rounded bg-primary text-white disabled:opacity-60">
          {submitting ? 'Granting…' : 'Grant access'}
        </button>
      </form>

      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      {loading ? <p className="text-sm text-black/60">Loading…</p> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.user_id} className="flex items-center justify-between gap-3 p-3 bg-surface border border-black/10 rounded">
              <div className="min-w-0">
                <p className="font-medium truncate">{r.email ?? '(email missing)'}</p>
                <p className="text-xs text-black/50 truncate">
                  {r.display_name ?? '—'}
                  {r.must_change_password && <span className="ml-2 font-numeric uppercase tracking-wide text-amber-700">needs password change</span>}
                </p>
              </div>
              <button onClick={() => onRemove(r.user_id, r.email ?? r.user_id)}
                      className="text-sm px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50">
                Remove access
              </button>
            </li>
          ))}
          {rows.length === 0 && <p className="text-sm text-black/60">No users with access yet.</p>}
        </ul>
      )}
    </div>
  );
}
