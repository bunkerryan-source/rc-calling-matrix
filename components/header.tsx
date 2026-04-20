'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = '/sign-in';
  }
  const linkClass = (href: string) =>
    `text-sm px-2 py-1 rounded ${pathname === href || pathname.startsWith(href + '/') ? 'text-primary font-medium' : 'text-black/60 hover:text-black'}`;
  return (
    <nav className="flex items-center gap-3 px-6 py-3 border-b border-black/10 bg-white">
      <Link href="/" className={linkClass('/')}>Master</Link>
      <Link href="/drafts" className={linkClass('/drafts')}>Drafts</Link>
      <Link href="/admin" className={linkClass('/admin')}>Admin</Link>
      <span className="flex-1" />
      <button onClick={signOut} aria-label="Sign out"
              className="text-sm text-black/60 hover:text-black inline-flex items-center gap-1">
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </nav>
  );
}
