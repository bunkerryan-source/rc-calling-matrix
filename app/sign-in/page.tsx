'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    params.get('error') === 'no-access' ? 'Your account does not have access.' : null
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    router.replace('/');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border border-black/10 rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl text-primary mb-6">Calling Matrix</h1>
        <label className="block text-sm mb-2">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-black/20 rounded px-3 py-2 mb-4"
        />
        <label className="block text-sm mb-2">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-black/20 rounded px-3 py-2 mb-4"
        />
        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white rounded py-2 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-6 text-xs text-black/60 text-center">
          Forgot password? Contact the admin.
        </p>
      </form>
    </main>
  );
}
