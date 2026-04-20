'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10) { setError('Password must be at least 10 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    if (error) { setError(error.message); setSubmitting(false); return; }
    router.replace('/');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border border-black/10 rounded-lg p-8 shadow-sm">
        <h1 className="text-xl text-primary mb-2">Set a new password</h1>
        <p className="text-sm text-black/70 mb-6">Your account uses a temporary password. Please set your own to continue.</p>
        <label className="block text-sm mb-2">New password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
               className="w-full border border-black/20 rounded px-3 py-2 mb-4" />
        <label className="block text-sm mb-2">Confirm password</label>
        <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
               className="w-full border border-black/20 rounded px-3 py-2 mb-4" />
        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}
        <button type="submit" disabled={submitting}
                className="w-full bg-primary text-white rounded py-2 disabled:opacity-60">
          {submitting ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </main>
  );
}
