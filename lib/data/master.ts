import { createClient } from '@/lib/supabase/server';
import { WARD_ID } from '@/lib/types';
import type { Organization, Calling, Person, MasterAssignment } from '@/lib/types';

export interface MasterData {
  organizations: Organization[];
  callings: Calling[];
  people: Person[];
  assignments: MasterAssignment[];
}

export async function loadMaster(): Promise<MasterData> {
  const supabase = await createClient();

  const [orgsRes, callingsRes, peopleRes, assignmentsRes] = await Promise.all([
    supabase.from('organizations').select('id, name, slug, sort_order').eq('ward_id', WARD_ID).order('sort_order'),
    supabase.from('callings').select('id, organization_id, title, sort_order').order('sort_order'),
    supabase.from('people').select('id, name, slug').eq('ward_id', WARD_ID).order('name'),
    supabase.from('master_assignments').select('calling_id, person_id, set_apart'),
  ]);

  if (orgsRes.error) throw orgsRes.error;
  if (callingsRes.error) throw callingsRes.error;
  if (peopleRes.error) throw peopleRes.error;
  if (assignmentsRes.error) throw assignmentsRes.error;

  return {
    organizations: orgsRes.data ?? [],
    callings: callingsRes.data ?? [],
    people: peopleRes.data ?? [],
    assignments: assignmentsRes.data ?? [],
  };
}
