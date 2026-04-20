import { loadMaster } from '@/lib/data/master';
import { createClient } from '@/lib/supabase/server';
import { DraftView } from '@/components/draft-view';
import { notFound } from 'next/navigation';

export default async function DraftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: draft } = await supabase
    .from('drafts').select('id, name, archived').eq('id', id).single();
  if (!draft) notFound();

  const master = await loadMaster();
  const [assignRes, stageRes] = await Promise.all([
    supabase.from('draft_assignments').select('draft_id, calling_id, person_id, called, sustained').eq('draft_id', id),
    supabase.from('draft_staging').select('draft_id, person_id').eq('draft_id', id),
  ]);

  return (
    <DraftView
      userId={user?.id ?? null}
      draft={draft}
      masterAssignments={master.assignments}
      organizations={master.organizations}
      callings={master.callings}
      people={master.people}
      draftAssignments={assignRes.data ?? []}
      staging={stageRes.data ?? []}
    />
  );
}
