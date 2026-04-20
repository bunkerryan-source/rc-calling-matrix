'use client';

import { useEffect, useState } from 'react';
import {
  listOrgsAndCallings, addOrg, renameOrg, deleteOrg,
  addCalling, renameCalling, deleteCalling,
} from '@/lib/data/organizations';
import { toSlug } from '@/lib/utils/slug';
import type { Organization, Calling } from '@/lib/types';

export function OrgsCallingsTab() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [callings, setCallings] = useState<Calling[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    const data = await listOrgsAndCallings();
    setOrgs(data.orgs); setCallings(data.callings); setLoading(false);
  }

  useEffect(() => { void reload(); }, []);

  async function onAddOrg() {
    const name = prompt('New organization name'); if (!name) return;
    const slug = toSlug(name);
    await addOrg(name, slug, orgs.length); void reload();
  }

  async function onRenameOrg(o: Organization) {
    const n = prompt('Rename organization', o.name); if (!n || n === o.name) return;
    await renameOrg(o.id, n); void reload();
  }

  async function onDeleteOrg(o: Organization) {
    if (!confirm(`Delete ${o.name} and all of its callings and assignments? This cannot be undone.`)) return;
    await deleteOrg(o.id); void reload();
  }

  async function onAddCalling(o: Organization) {
    const title = prompt('Calling title'); if (!title) return;
    const count = callings.filter((c) => c.organization_id === o.id).length;
    await addCalling(o.id, title, count); void reload();
  }

  async function onRenameCalling(c: Calling) {
    const t = prompt('Rename calling', c.title); if (!t || t === c.title) return;
    await renameCalling(c.id, t); void reload();
  }

  async function onDeleteCalling(c: Calling) {
    if (!confirm('Delete this calling? Assignments on it will be cleared.')) return;
    await deleteCalling(c.id); void reload();
  }

  if (loading) return <p className="text-sm text-black/60">Loading…</p>;

  return (
    <div>
      <button onClick={onAddOrg}
              className="mb-4 px-3 py-1.5 rounded bg-primary text-white">Add organization</button>
      <ul className="space-y-4">
        {orgs.map((o) => (
          <li key={o.id} className="bg-surface border border-black/10 rounded p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-primary">{o.name}</h3>
              <div className="flex gap-2 text-sm">
                <button onClick={() => onRenameOrg(o)} className="text-primary">Rename</button>
                <button onClick={() => onDeleteOrg(o)} className="text-red-700">Delete</button>
              </div>
            </div>
            <ul className="mt-2 space-y-1">
              {callings.filter((c) => c.organization_id === o.id).map((c) => (
                <li key={c.id} className="flex items-center justify-between py-1 border-b border-black/5">
                  <span className="text-sm">{c.title}</span>
                  <div className="flex gap-2 text-sm">
                    <button onClick={() => onRenameCalling(c)} className="text-primary">Rename</button>
                    <button onClick={() => onDeleteCalling(c)} className="text-red-700">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
            <button onClick={() => onAddCalling(o)}
                    className="mt-2 text-sm text-primary">+ Add calling</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
