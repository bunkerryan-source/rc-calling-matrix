'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserAccessRow } from '@/lib/types';

interface Row extends UserAccessRow { email: string | null; }

export function UsersTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const supabase = createClient();
    const { data: access } = await supabase
      .from('user_access')
      .select('user_id, ward_id, display_name, granted_at');
    // Fetch emails via a view or via auth admin; for MVP we store display_name and show user_id.
    setRows((access ?? []).map((a) => ({ ...a, email: null })));
    setLoading(false);
  }

  useEffect(() => { void reload(); }, []);

  async function onRemove(userId: string) {
    if (!confirm('Remove this user\'s access? They will be signed out on their next page load.')) return;
    const supabase = createClient();
    const { error } = await supabase.from('user_access').delete().eq('user_id', userId);
    if (error) { alert(error.message); return; }
    void reload();
  }

  return (
    <div>
      <p className="text-sm text-black/70 mb-4">
        To invite a new user, create them in the Supabase dashboard under Authentication → Users, then add their row here via SQL (or ask Ryan to do it).
        Removing access here does not delete the auth user.
      </p>
      {loading ? <p className="text-sm text-black/60">Loading…</p> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.user_id} className="flex items-center justify-between gap-3 p-3 bg-surface border border-black/10 rounded">
              <div>
                <p className="font-medium">{r.display_name ?? '(no display name)'}</p>
                <p className="text-xs text-black/50 font-numeric">{r.user_id}</p>
              </div>
              <button onClick={() => onRemove(r.user_id)}
                      className="text-sm px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50">
                Remove access
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
