-- Fix: the original admin_* RPCs had unqualified `user_id` inside the
-- existence checks. The enclosing RETURNS TABLE declaration creates
-- implicit OUT parameters with the same names, which Postgres flags as
-- ambiguous ("column reference 'user_id' is ambiguous"). Alias the
-- user_access references in both RPCs so the column/parameter resolution
-- is unambiguous.

create or replace function public.admin_list_user_access()
returns table (
  user_id uuid,
  ward_id uuid,
  display_name text,
  granted_at timestamptz,
  email text,
  must_change_password boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
      and ua.ward_id = '00000000-0000-0000-0000-000000000001'::uuid
  ) then
    raise exception 'Forbidden';
  end if;

  return query
    select ua.user_id,
           ua.ward_id,
           ua.display_name,
           ua.granted_at,
           u.email::text,
           coalesce((u.raw_user_meta_data->>'must_change_password')::boolean, false)
    from public.user_access ua
    left join auth.users u on u.id = ua.user_id
    where ua.ward_id = '00000000-0000-0000-0000-000000000001'::uuid
    order by u.email nulls last;
end;
$$;

grant execute on function public.admin_list_user_access() to authenticated;

create or replace function public.admin_grant_access(
  target_email text,
  display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  if not exists (
    select 1 from public.user_access ua
    where ua.user_id = auth.uid()
      and ua.ward_id = '00000000-0000-0000-0000-000000000001'::uuid
  ) then
    raise exception 'Forbidden';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(trim(target_email));

  if v_user_id is null then
    raise exception 'No user with email % exists in Supabase Auth. Create them in the Supabase dashboard first.', target_email;
  end if;

  insert into public.user_access (user_id, ward_id, display_name, granted_by)
  values (
    v_user_id,
    '00000000-0000-0000-0000-000000000001'::uuid,
    admin_grant_access.display_name,
    auth.uid()
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    granted_by = excluded.granted_by,
    granted_at = now();

  return v_user_id;
end;
$$;

grant execute on function public.admin_grant_access(text, text) to authenticated;
