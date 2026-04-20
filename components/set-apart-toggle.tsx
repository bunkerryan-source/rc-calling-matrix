'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';

export function SetApartToggle({ callingId, initial }: { callingId: string; initial: boolean }) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  function onToggle() {
    const next = !value;
    setValue(next); // optimistic
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('master_assignments')
        .update({ set_apart: next, updated_at: new Date().toISOString() })
        .eq('calling_id', callingId);
      if (error) {
        setValue(!next);
        console.error('Set Apart toggle failed:', error);
      }
    });
  }

  return (
    <button
      onClick={onToggle}
      disabled={pending}
      className={`text-xs px-2 py-0.5 rounded border font-numeric ${value ? 'bg-primary text-white border-primary' : 'bg-white text-black/60 border-black/20'}`}
      aria-pressed={value}
    >
      {value ? 'Set Apart: Y' : 'Set Apart: N'}
    </button>
  );
}
