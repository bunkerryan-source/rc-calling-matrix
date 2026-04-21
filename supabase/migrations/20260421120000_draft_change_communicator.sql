-- Per-change communicator assignment for draft diffs.
-- Ephemeral to the draft: never copied into master or promotion_history.
-- Cascades when the draft (or person) is deleted.

create table draft_change_communicator (
  draft_id uuid references drafts(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  role text not null check (role in ('bishop','first','second')),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  primary key (draft_id, person_id)
);

alter table draft_change_communicator enable row level security;

create policy draft_change_communicator_s on draft_change_communicator
  for select using (is_authorized());
create policy draft_change_communicator_i on draft_change_communicator
  for insert with check (is_authorized());
create policy draft_change_communicator_u on draft_change_communicator
  for update using (is_authorized()) with check (is_authorized());
create policy draft_change_communicator_d on draft_change_communicator
  for delete using (is_authorized());
