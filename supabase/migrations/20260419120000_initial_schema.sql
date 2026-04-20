-- Wards
create table wards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- People
create table people (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references wards(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz default now(),
  unique (ward_id, slug)
);

-- Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references wards(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  unique (ward_id, slug)
);

-- Callings
create table callings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  sort_order int not null default 0
);

-- Master assignments
create table master_assignments (
  calling_id uuid primary key references callings(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  set_apart boolean not null default false,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- Master meta
create table master_meta (
  ward_id uuid primary key references wards(id) on delete cascade,
  last_promoted_at timestamptz,
  last_promoted_by uuid references auth.users(id),
  last_promoted_from_draft text
);

-- Drafts
create table drafts (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references wards(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  based_on_master_at timestamptz not null,
  archived boolean not null default false
);

-- Draft assignments
create table draft_assignments (
  draft_id uuid references drafts(id) on delete cascade,
  calling_id uuid references callings(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  called boolean not null default false,
  sustained boolean not null default false,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  primary key (draft_id, calling_id)
);

-- Draft staging
create table draft_staging (
  draft_id uuid references drafts(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (draft_id, person_id)
);

-- Promotion history
create table promotion_history (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references wards(id) on delete cascade,
  draft_name text not null,
  promoted_at timestamptz default now(),
  promoted_by uuid references auth.users(id),
  snapshot jsonb not null
);

-- User access
create table user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ward_id uuid not null references wards(id) on delete cascade,
  display_name text,
  granted_by uuid references auth.users(id),
  granted_at timestamptz default now()
);

-- Useful indexes
create index on callings (organization_id, sort_order);
create index on organizations (ward_id, sort_order);
create index on draft_assignments (draft_id);
create index on draft_staging (draft_id);
create index on promotion_history (ward_id, promoted_at desc);
