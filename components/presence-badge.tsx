'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PresenceBadge({ channelName, userId }: { channelName: string; userId: string | null }) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase.channel(channelName, { config: { presence: { key: userId } } });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
      });
    return () => { void supabase.removeChannel(channel); };
  }, [channelName, userId]);

  if (count <= 1) return null;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-white text-primary border border-primary/30 font-numeric">
      {count} members here
    </span>
  );
}
