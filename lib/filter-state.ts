'use client';

import { useEffect, useState } from 'react';

export type FilterState = {
  all: boolean;
  orgSlugs: Set<string>;
  setApart: boolean;
  noCalling: boolean;
};

const KEY = (userId: string) => `calling-matrix:filter:${userId}`;

export function useFilterState(userId: string | null): [FilterState, (s: FilterState) => void] {
  const [state, setState] = useState<FilterState>({ all: true, orgSlugs: new Set(), setApart: false, noCalling: false });

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(KEY(userId));
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({
          all: !!parsed.all,
          orgSlugs: new Set(parsed.orgSlugs ?? []),
          setApart: !!parsed.setApart,
          noCalling: !!parsed.noCalling,
        });
      }
    } catch {}
  }, [userId]);

  function save(next: FilterState) {
    setState(next);
    if (!userId) return;
    localStorage.setItem(KEY(userId), JSON.stringify({
      all: next.all,
      orgSlugs: [...next.orgSlugs],
      setApart: next.setApart,
      noCalling: next.noCalling,
    }));
  }

  return [state, save];
}
