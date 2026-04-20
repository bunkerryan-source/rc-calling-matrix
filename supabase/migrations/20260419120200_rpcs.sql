-- Create a new draft: inserts drafts row and snapshots current master_assignments into draft_assignments.
create or replace function create_draft(p_ward_id uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not is_authorized() then
    raise exception 'not authorized';
  end if;

  insert into drafts (ward_id, name, created_by, based_on_master_at)
  values (p_ward_id, p_name, auth.uid(), now())
  returning id into new_id;

  insert into draft_assignments (draft_id, calling_id, person_id, called, sustained, updated_by)
  select new_id, ma.calling_id, ma.person_id, false, false, auth.uid()
  from master_assignments ma;

  return new_id;
end;
$$;

-- Promote a draft to master in a single transaction.
create or replace function promote_draft(p_draft_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ward_id uuid;
  v_draft_name text;
  v_history_id uuid;
begin
  if not is_authorized() then
    raise exception 'not authorized';
  end if;

  select ward_id, name into v_ward_id, v_draft_name
  from drafts where id = p_draft_id;

  if v_ward_id is null then
    raise exception 'draft not found';
  end if;

  -- Upsert: preserve set_apart where person didn't change
  insert into master_assignments (calling_id, person_id, set_apart, updated_at, updated_by)
  select
    da.calling_id,
    da.person_id,
    coalesce(
      (select ma.set_apart from master_assignments ma
       where ma.calling_id = da.calling_id and ma.person_id = da.person_id),
      false
    ),
    now(),
    auth.uid()
  from draft_assignments da
  where da.draft_id = p_draft_id
  on conflict (calling_id) do update set
    person_id = excluded.person_id,
    set_apart = case
      when master_assignments.person_id = excluded.person_id then master_assignments.set_apart
      else false
    end,
    updated_at = now(),
    updated_by = auth.uid();

  -- Delete master rows whose calling isn't in the draft
  delete from master_assignments
  where calling_id not in (select calling_id from draft_assignments where draft_id = p_draft_id);

  -- Archive the draft
  update drafts set archived = true where id = p_draft_id;

  -- Update master meta
  insert into master_meta (ward_id, last_promoted_at, last_promoted_by, last_promoted_from_draft)
  values (v_ward_id, now(), auth.uid(), v_draft_name)
  on conflict (ward_id) do update set
    last_promoted_at = excluded.last_promoted_at,
    last_promoted_by = excluded.last_promoted_by,
    last_promoted_from_draft = excluded.last_promoted_from_draft;

  -- Write history snapshot (name-resolved so it survives hard deletes)
  insert into promotion_history (ward_id, draft_name, promoted_by, snapshot)
  values (
    v_ward_id,
    v_draft_name,
    auth.uid(),
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'calling_id', ma.calling_id,
        'calling_title', c.title,
        'organization_name', o.name,
        'person_id', ma.person_id,
        'person_name', p.name,
        'set_apart', ma.set_apart
      )), '[]'::jsonb)
      from master_assignments ma
      join callings c on c.id = ma.calling_id
      join organizations o on o.id = c.organization_id
      join people p on p.id = ma.person_id
      where o.ward_id = v_ward_id
    )
  )
  returning id into v_history_id;

  return v_history_id;
end;
$$;

grant execute on function create_draft(uuid, text) to authenticated;
grant execute on function promote_draft(uuid) to authenticated;
