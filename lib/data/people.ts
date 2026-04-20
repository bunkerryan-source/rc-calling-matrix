'use client';

import { createClient } from '@/lib/supabase/client';
import { uniqueSlug } from '@/lib/utils/slug';
import { WARD_ID } from '@/lib/types';

export async function addPerson(name: string) {
  const supabase = createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from('people').select('slug').eq('ward_id', WARD_ID);
  if (fetchErr) throw fetchErr;

  const taken = new Set((existing ?? []).map((p) => p.slug));
  const slug = uniqueSlug(name, taken);

  const { data, error } = await supabase
    .from('people')
    .insert({ ward_id: WARD_ID, name, slug })
    .select('id, name, slug')
    .single();
  if (error) throw error;
  return data;
}

export async function deletePerson(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('people').delete().eq('id', id);
  if (error) throw error;
}

export async function renamePerson(id: string, name: string) {
  const supabase = createClient();
  const { error } = await supabase.from('people').update({ name }).eq('id', id);
  if (error) throw error;
}
