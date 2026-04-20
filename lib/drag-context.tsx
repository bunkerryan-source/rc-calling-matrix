'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface DragPayload { personId: string; fromCallingId: string | null; fromStaging: boolean; }
interface DragCtx {
  active: DragPayload | null;
  pickup: (p: DragPayload) => void;
  drop: () => void;
  onDropTo: ((target: { kind: 'calling'; callingId: string } | { kind: 'unassigned' }) => void) | null;
  setOnDropTo: (cb: DragCtx['onDropTo']) => void;
}

const Ctx = createContext<DragCtx | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<DragPayload | null>(null);
  const [cb, setCb] = useState<DragCtx['onDropTo']>(null);
  return (
    <Ctx.Provider value={{
      active,
      pickup: (p) => setActive(p),
      drop: () => setActive(null),
      onDropTo: cb,
      setOnDropTo: (c) => setCb(() => c),
    }}>{children}</Ctx.Provider>
  );
}

export function useDrag() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDrag outside DragProvider');
  return v;
}
