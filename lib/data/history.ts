'use client';

import { createClient } from '@/lib/supabase/client';
import { WARD_ID } from '@/lib/types';
import type { PromotionHistoryRow } from '@/lib/types';

export async function listPromotionHistory(): Promise<PromotionHistoryRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('promotion_history')
    .select('id, draft_name, promoted_at, promoted_by, snapshot')
    .eq('ward_id', WARD_ID)
    .order('promoted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PromotionHistoryRow[];
}
