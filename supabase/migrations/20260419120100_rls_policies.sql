-- Enable RLS on every application table
alter table wards enable row level security;
alter table people enable row level security;
alter table organizations enable row level security;
alter table callings enable row level security;
alter table master_assignments enable row level security;
alter table master_meta enable row level security;
alter table drafts enable row level security;
alter table draft_assignments enable row level security;
alter table draft_staging enable row level security;
alter table promotion_history enable row level security;
alter table user_access enable row level security;

-- Helper: is the caller a provisioned user?
create or replace function is_authorized() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_access where user_id = auth.uid());
$$;

-- Blanket policies: authenticated + in user_access = full CRUD everywhere.
-- Applied table-by-table for explicitness.

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'wards','people','organizations','callings',
      'master_assignments','master_meta',
      'drafts','draft_assignments','draft_staging',
      'promotion_history','user_access'
    ])
  loop
    execute format('create policy %I on %I for select using (is_authorized())', t||'_s', t);
    execute format('create policy %I on %I for insert with check (is_authorized())', t||'_i', t);
    execute format('create policy %I on %I for update using (is_authorized()) with check (is_authorized())', t||'_u', t);
    execute format('create policy %I on %I for delete using (is_authorized())', t||'_d', t);
  end loop;
end $$;
