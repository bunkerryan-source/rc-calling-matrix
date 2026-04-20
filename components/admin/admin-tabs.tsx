'use client';

import { useState } from 'react';
import { UsersTab } from './users-tab';
import { PeopleTab } from './people-tab';
import { OrgsCallingsTab } from './orgs-callings-tab';
import { HistoryTab } from './history-tab';

const TABS = ['Users', 'People', 'Organizations & Callings', 'Promotion History'] as const;
type Tab = typeof TABS[number];

export function AdminTabs() {
  const [tab, setTab] = useState<Tab>('Users');
  return (
    <div>
      <div className="flex gap-1 border-b border-black/10 mb-6">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-2 text-sm ${tab === t ? 'border-b-2 border-primary text-primary font-medium' : 'text-black/60 hover:text-black'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Users' && <UsersTab />}
      {tab === 'People' && <PeopleTab />}
      {tab === 'Organizations & Callings' && <OrgsCallingsTab />}
      {tab === 'Promotion History' && <HistoryTab />}
    </div>
  );
}
