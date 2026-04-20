import { loadMaster } from '@/lib/data/master';
import { createClient } from '@/lib/supabase/server';
import { MasterView } from '@/components/master-view';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const data = await loadMaster();
  return <MasterView userId={user?.id ?? null} {...data} />;
}
