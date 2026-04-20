'use client';

import { createClient } from '@/lib/supabase/client';
import { WARD_ID } from '@/lib/types';
import type { DraftRow, DraftAssignment, DraftStaging } from '@/lib/types';

export async function listDrafts(includeArchived: boolean): Promise<DraftRow[]> {
  const supabase = createClient();
  let q = supabase
    .from('drafts')
    .select('id, name, created_by, created_at, based_on_master_at, archived')
    .eq('ward_id', WARD_ID)
    .order('created_at', { ascending: false });
  if (!includeArchived) q = q.eq('archived', false);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createDraft(name: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_draft', { p_ward_id: WARD_ID, p_name: name });
  if (error) throw error;
  return data as string;
}

export async function renameDraft(id: string, name: string) {
  const supabase = createClient();
  const { error } = await supabase.from('drafts').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteDraft(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('drafts').delete().eq('id', id);
  if (error) throw error;
}

export async function promoteDraft(id: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('promote_draft', { p_draft_id: id });
  if (error) throw error;
  return data as string;
}

export async function loadDraftDetail(id: string) {
  const supabase = createClient();
  const [draftRes, assignRes, stageRes] = await Promise.all([
    supabase.from('drafts').select('id, name, created_by, created_at, based_on_master_at, archived').eq('id', id).single(),
    supabase.from('draft_assignments').select('draft_id, calling_id, person_id, called, sustained').eq('draft_id', id),
    supabase.from('draft_staging').select('draft_id, person_id').eq('draft_id', id),
  ]);
  if (draftRes.error) throw draftRes.error;
  if (assignRes.error) throw assignRes.error;
  if (stageRes.error) throw stageRes.error;
  return {
    draft: draftRes.data as DraftRow,
    assignments: (assignRes.data ?? []) as DraftAssignment[],
    staging: (stageRes.data ?? []) as DraftStaging[],
  };
}

// Drag-and-drop move: place personId into callingId; returns the displaced personId (if any) for staging.
export async function movePerson({
  draftId, callingId, personId,
}: { draftId: string; callingId: string; personId: string; }): Promise<string | null> {
  const supabase = createClient();

  // Look up current occupant (if any)
  const { data: existing, error: exErr } = await supabase
    .from('draft_assignments')
    .select('person_id')
    .eq('draft_id', draftId)
    .eq('calling_id', callingId)
    .maybeSingle();
  if (exErr) throw exErr;

  // If the person is already assigned to a different calling in this draft, clear that calling
  const { error: clearErr } = await supabase
    .from('draft_assignments')
    .delete()
    .eq('draft_id', draftId)
    .eq('person_id', personId);
  if (clearErr) throw clearErr;

  // Upsert the new assignment with Called/Sustained reset
  const { error: upErr } = await supabase
    .from('draft_assignments')
    .upsert({
      draft_id: draftId, calling_id: callingId, person_id: personId,
      called: false, sustained: false, updated_at: new Date().toISOString(),
    });
  if (upErr) throw upErr;

  const displaced = existing?.person_id && existing.person_id !== personId ? existing.person_id : null;

  if (displaced) {
    const { error: stageErr } = await supabase
      .from('draft_staging')
      .upsert({ draft_id: draftId, person_id: displaced });
    if (stageErr) throw stageErr;
  }

  // Remove from staging if the person being placed was staged
  await supabase
    .from('draft_staging')
    .delete()
    .eq('draft_id', draftId)
    .eq('person_id', personId);

  return displaced;
}

export async function unassign(draftId: string, personId: string) {
  const supabase = createClient();
  await supabase.from('draft_assignments').delete().eq('draft_id', draftId).eq('person_id', personId);
  await supabase.from('draft_staging').delete().eq('draft_id', draftId).eq('person_id', personId);
}

export async function setCalled(draftId: string, callingId: string, called: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from('draft_assignments')
    .update({ called, updated_at: new Date().toISOString() })
    .eq('draft_id', draftId).eq('calling_id', callingId);
  if (error) throw error;
}

export async function setSustained(draftId: string, callingId: string, sustained: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from('draft_assignments')
    .update({ sustained, updated_at: new Date().toISOString() })
    .eq('draft_id', draftId).eq('calling_id', callingId);
  if (error) throw error;
}
