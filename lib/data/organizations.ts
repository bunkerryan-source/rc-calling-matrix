'use client';

import { createClient } from '@/lib/supabase/client';
import { WARD_ID } from '@/lib/types';

export async function listOrgsAndCallings() {
  const supabase = createClient();
  const [orgs, callings] = await Promise.all([
    supabase.from('organizations').select('id, name, slug, sort_order').eq('ward_id', WARD_ID).order('sort_order'),
    supabase.from('callings').select('id, organization_id, title, sort_order').order('sort_order'),
  ]);
  return { orgs: orgs.data ?? [], callings: callings.data ?? [] };
}

export async function addOrg(name: string, slug: string, sort_order: number) {
  const supabase = createClient();
  const { error } = await supabase.from('organizations').insert({ ward_id: WARD_ID, name, slug, sort_order });
  if (error) throw error;
}

export async function renameOrg(id: string, name: string) {
  const supabase = createClient();
  const { error } = await supabase.from('organizations').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteOrg(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('organizations').delete().eq('id', id);
  if (error) throw error;
}

export async function addCalling(organization_id: string, title: string, sort_order: number) {
  const supabase = createClient();
  const { error } = await supabase.from('callings').insert({ organization_id, title, sort_order });
  if (error) throw error;
}

export async function renameCalling(id: string, title: string) {
  const supabase = createClient();
  const { error } = await supabase.from('callings').update({ title }).eq('id', id);
  if (error) throw error;
}

export async function deleteCalling(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('callings').delete().eq('id', id);
  if (error) throw error;
}
