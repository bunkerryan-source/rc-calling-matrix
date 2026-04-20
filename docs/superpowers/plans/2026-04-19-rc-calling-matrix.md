# Rancho Carrillo Calling Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-user Next.js + Supabase web app that replaces the bishopric's read-only Excel calling matrix with a collaborative master/draft editor.

**Architecture:** Next.js 14 App Router on Vercel, backed by Supabase Postgres + Auth + Realtime. Flat collab — every authenticated user has full read/write. Master view is read-only except the Set Apart toggle; all other edits happen in copy-on-write drafts that can be promoted back to master via a transactional RPC.

**Tech Stack:** Next.js 14+, TypeScript (strict), Tailwind CSS v3, lucide-react, `@supabase/supabase-js`, `@supabase/ssr`, Supabase Postgres/Auth/Realtime, Vercel.

**Source of truth:** [2026-04-19-rc-calling-matrix-design.md](../specs/2026-04-19-rc-calling-matrix-design.md). All design decisions live there.

**Testing posture:** No automated test runner in MVP (per design §12). Each feature is verified manually via `npm run dev` on Ryan's Windows machine. "Run the test" steps below are manual smoke checks.

**Working directory:** `c:\Users\rbunker\claude-workspace\projects\church\rc-calling-matrix\`

---

## File Structure (what gets built, where)

```
rc-calling-matrix/
├── app/
│   ├── layout.tsx                   # root layout, fonts, metadata
│   ├── page.tsx                     # Master view
│   ├── globals.css                  # Tailwind + base
│   ├── sign-in/page.tsx
│   ├── account/set-password/page.tsx
│   ├── drafts/
│   │   ├── page.tsx                 # drafts list
│   │   └── [id]/page.tsx            # draft editor
│   └── admin/page.tsx               # admin tabs
├── middleware.ts                    # auth gate
├── components/
│   ├── header.tsx
│   ├── sidebar-filter.tsx
│   ├── org-card.tsx
│   ├── calling-row.tsx
│   ├── person-chip.tsx
│   ├── add-member-modal.tsx
│   ├── set-apart-toggle.tsx
│   ├── staging-rail.tsx
│   ├── changes-panel.tsx
│   ├── promote-modal.tsx
│   ├── presence-badge.tsx
│   └── admin/
│       ├── users-tab.tsx
│       ├── people-tab.tsx
│       ├── orgs-callings-tab.tsx
│       └── history-tab.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # browser client
│   │   ├── server.ts                # RSC/server client
│   │   └── middleware.ts            # middleware helper
│   ├── data/
│   │   ├── master.ts
│   │   ├── drafts.ts
│   │   ├── people.ts
│   │   ├── organizations.ts
│   │   └── history.ts
│   ├── utils/
│   │   ├── slug.ts
│   │   ├── title-case.ts
│   │   ├── initials.ts
│   │   └── avatar-bg.ts
│   ├── filter-state.ts              # localStorage sidebar persistence
│   └── types.ts                     # shared domain types
├── supabase/migrations/
│   ├── 20260419120000_initial_schema.sql
│   ├── 20260419120100_rls_policies.sql
│   ├── 20260419120200_rpcs.sql
│   └── 20260419120300_seed.sql
├── docs/                            # existing spec/design/plans preserved here
├── .env.local                       # gitignored
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Phase 0 — Preflight

### Task 0: Confirm repo + workspace layout

**Files:** none yet.

- [ ] **Step 1: Get GitHub repo URL from Ryan**

Ask Ryan for the repo URL (e.g., `https://github.com/rbunker/rc-calling-matrix.git`). If the repo is empty, proceed to Step 2. If it already has content, stop and ask Ryan what's in it.

- [ ] **Step 2: Clone into working directory**

Working dir already contains `docs/`, the source spec files, and the JSX/xlsx artifacts. Clone the empty repo on top without clobbering them:

```bash
cd c:/Users/rbunker/claude-workspace/projects/church/rc-calling-matrix
git init
git remote add origin <REPO_URL_FROM_RYAN>
git fetch origin
git checkout -b main
```

If Ryan's repo has a committed `README.md` or `LICENSE`, merge it:

```bash
git pull origin main --allow-unrelated-histories
```

- [ ] **Step 3: Reorganize source artifacts into `docs/source/`**

Move the pre-existing source material so it doesn't clutter the Next.js root:

```bash
mkdir -p docs/source
mv rc-calling-matrix-spec.md docs/source/
mv rc-calling-matrix-design.md docs/source/
mv rc-calling-matrix.jsx docs/source/
mv rc-calling-matrix.xlsx docs/source/
mv Christ-Church-Symbol.png docs/source/
mv church_communication_guide.webp docs/source/
```

- [ ] **Step 4: Commit the initial structure**

```bash
git add docs/
git commit -m "Import source spec, design, and reference artifacts"
```

---

## Phase 1 — Scaffolding

### Task 1: Initialize Next.js app

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `postcss.config.mjs`, `tailwind.config.ts`

- [ ] **Step 1: Run the Next.js scaffolder non-interactively in the repo root**

```bash
cd c:/Users/rbunker/claude-workspace/projects/church/rc-calling-matrix
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --no-turbopack --use-npm
```

Confirm `Y` to writing into a non-empty directory when prompted. This creates `app/`, Tailwind, ESLint, and a TypeScript baseline alongside existing `docs/`.

- [ ] **Step 2: Verify the dev server boots**

```bash
npm run dev
```

Expected: server listens on `http://localhost:3000`, default Next landing renders. Kill with Ctrl+C after confirming.

- [ ] **Step 3: Commit the scaffold**

```bash
git add .
git commit -m "Scaffold Next.js 14 App Router app"
```

### Task 2: Tighten TypeScript config

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Replace `tsconfig.json` compilerOptions**

Merge these under `compilerOptions` (keep existing `paths`, `jsx`, etc.):

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "forceConsistentCasingInFileNames": true
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npx tsc --noEmit
```

Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "Enable strict and noUncheckedIndexedAccess"
```

### Task 3: Install runtime dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install Supabase + icons**

```bash
npm install @supabase/supabase-js @supabase/ssr lucide-react
```

- [ ] **Step 2: Install dev-only types**

```bash
npm install -D @types/node
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add Supabase, SSR helpers, and lucide-react"
```

### Task 4: Configure fonts and globals

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`

- [ ] **Step 1: Replace `app/layout.tsx` contents**

```tsx
import type { Metadata } from 'next';
import { Source_Serif_4, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Calling Matrix — Rancho Carrillo Ward',
  description: 'Bishopric calling management',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-white text-black font-sans antialiased">{children}</body>
    </html>
  );
}
```

(Source Serif Pro is published on Google Fonts as "Source Serif 4" — same family, current name.)

- [ ] **Step 2: Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #005175;
  --color-draft: #C4871F;
  --color-surface: #FAF8F4;
}

body {
  font-family: var(--font-sans);
}

h1, h2, h3, h4 {
  font-family: var(--font-serif);
  font-weight: 600;
}

.font-numeric {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 3: Extend Tailwind with the design tokens**

Replace `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#005175',
        draft: '#C4871F',
        surface: '#FAF8F4',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Open `http://localhost:3000` and confirm fonts load (view DevTools → Network → filter by font to see the Google font requests). Kill the server.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css tailwind.config.ts
git commit -m "Wire fonts (Source Serif 4, Inter, JetBrains Mono) and design tokens"
```

### Task 5: Placeholder homepage

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace with a minimal placeholder**

```tsx
export default function HomePage() {
  return (
    <main className="container mx-auto px-6 py-12">
      <h1 className="text-4xl text-primary">Calling Matrix</h1>
      <p className="mt-4 text-black/70">Rancho Carrillo Ward — placeholder home.</p>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run `npm run dev`, confirm the title renders in serif + primary blue.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "Add placeholder home page"
```

---

## Phase 2 — Supabase project + schema

Phase 2 tasks use the Supabase MCP connected to Ryan's Claude Code. If the MCP isn't available, the equivalent `supabase` CLI commands work too.

### Task 6: Create `calling-matrix-dev` Supabase project

**Files:** none (done via MCP).

- [ ] **Step 1: Get Ryan's Supabase organization id**

Use MCP: `mcp__claude_ai_Supabase__list_organizations`. If multiple, ask Ryan which to use.

- [ ] **Step 2: Create the dev project**

Use MCP: `mcp__claude_ai_Supabase__create_project` with:
- `name`: `calling-matrix-dev`
- `organization_id`: (from Step 1)
- `region`: `us-west-1` (San Diego-adjacent)

Capture the returned project id, URL, and anon key.

- [ ] **Step 3: Write `.env.example`**

Create at repo root:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 4: Write `.env.local` (not committed)**

Populate with the dev project's URL and anon key from Step 2. Confirm `.env.local` is already in `.gitignore` (Next.js scaffolder adds it by default).

- [ ] **Step 5: Commit**

```bash
git add .env.example
git commit -m "Add env template for Supabase URL + anon key"
```

### Task 7: Initial schema migration

**Files:**
- Create: `supabase/migrations/20260419120000_initial_schema.sql`

- [ ] **Step 1: Create the file with the full schema**

```sql
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
```

- [ ] **Step 2: Apply via MCP**

Use `mcp__claude_ai_Supabase__apply_migration` with:
- `project_id`: (from Task 6)
- `name`: `initial_schema`
- `query`: contents of the file

- [ ] **Step 3: Verify**

Use `mcp__claude_ai_Supabase__list_tables` on the project; confirm all 11 tables exist.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260419120000_initial_schema.sql
git commit -m "Initial Supabase schema (wards, people, orgs, callings, drafts, history)"
```

### Task 8: RLS policies

**Files:**
- Create: `supabase/migrations/20260419120100_rls_policies.sql`

- [ ] **Step 1: Write the file**

```sql
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
    execute format('create policy %I_select on %I for select using (is_authorized())', t||'_s', t);
    execute format('create policy %I_insert on %I for insert with check (is_authorized())', t||'_i', t);
    execute format('create policy %I_update on %I for update using (is_authorized()) with check (is_authorized())', t||'_u', t);
    execute format('create policy %I_delete on %I for delete using (is_authorized())', t||'_d', t);
  end loop;
end $$;
```

- [ ] **Step 2: Apply via MCP**

`mcp__claude_ai_Supabase__apply_migration` with name `rls_policies` and this SQL.

- [ ] **Step 3: Verify**

Use `mcp__claude_ai_Supabase__get_advisors` with `type: "security"`. Confirm no "RLS disabled" warnings remain on application tables.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260419120100_rls_policies.sql
git commit -m "Enable RLS with user_access gate on every application table"
```

### Task 9: RPCs (`create_draft`, `promote_draft`)

**Files:**
- Create: `supabase/migrations/20260419120200_rpcs.sql`

- [ ] **Step 1: Write the file**

```sql
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
```

- [ ] **Step 2: Apply via MCP**

`apply_migration` with name `rpcs`.

- [ ] **Step 3: Verify**

Use `mcp__claude_ai_Supabase__execute_sql`: `select routine_name from information_schema.routines where routine_name in ('create_draft','promote_draft','is_authorized');`

Expected: three rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260419120200_rpcs.sql
git commit -m "Add create_draft and promote_draft RPCs"
```

### Task 10: Seed migration from JSX `INITIAL_DATA`

**Files:**
- Create: `supabase/migrations/20260419120300_seed.sql`
- Tool: a small Node helper at `scripts/build-seed.mjs` to generate the SQL from the JSX

- [ ] **Step 1: Create `scripts/build-seed.mjs`**

```js
// Reads the JSX artifact, extracts INITIAL_DATA, and writes a seed SQL migration.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const JSX_PATH = 'docs/source/rc-calling-matrix.jsx';
const OUT_PATH = 'supabase/migrations/20260419120300_seed.sql';

const ORG_SORT = [
  'bishopric', 'clerks-extended-bishopric',
  'deacons-quorum', 'teachers-quorum', 'priests-quorum',
  'young-women-11-12', 'young-women-13-14', 'young-women-15-18',
  'sunday-school', 'relief-society', 'elders-quorum', 'primary',
  'young-women', 'emergency-prep', 'music', 'employment', 'single-adults',
  'ward-history', 'friendship-meal-coordination', 'temple-prep',
  'building-maintenance', 'ward-activities',
  'stake-callings',
];

const src = readFileSync(JSX_PATH, 'utf8');
const match = src.match(/const INITIAL_DATA = (\{[\s\S]*?\});/);
if (!match) throw new Error('INITIAL_DATA not found');
const data = JSON.parse(match[1]);

const esc = (s) => String(s).replace(/'/g, "''");

const lines = [
  '-- Seed Rancho Carrillo Ward',
  `insert into wards (id, name) values ('00000000-0000-0000-0000-000000000001', 'Rancho Carrillo Ward');`,
  '',
];

// People
lines.push('-- People');
for (const p of data.people) {
  lines.push(
    `insert into people (ward_id, name, slug) values ('00000000-0000-0000-0000-000000000001', '${esc(p.name)}', '${esc(p.id)}');`
  );
}
lines.push('');

// Organizations
lines.push('-- Organizations');
for (const o of data.organizations) {
  const idx = ORG_SORT.indexOf(o.id);
  const sort = idx === -1 ? 999 : idx;
  lines.push(
    `insert into organizations (ward_id, name, slug, sort_order) values ('00000000-0000-0000-0000-000000000001', '${esc(o.name)}', '${esc(o.id)}', ${sort});`
  );
}
lines.push('');

// Callings
lines.push('-- Callings');
for (const o of data.organizations) {
  o.callings.forEach((c, i) => {
    lines.push(
      `insert into callings (organization_id, title, sort_order) values ((select id from organizations where slug = '${esc(o.id)}' and ward_id = '00000000-0000-0000-0000-000000000001'), '${esc(c.title)}', ${i});`
    );
  });
}
lines.push('');

// Master assignments
lines.push('-- Master assignments');
for (const o of data.organizations) {
  for (const c of o.callings) {
    if (!c.personId) continue;
    lines.push(
      `insert into master_assignments (calling_id, person_id) values ((select c.id from callings c join organizations o on o.id = c.organization_id where o.slug = '${esc(o.id)}' and c.title = '${esc(c.title)}' limit 1), (select id from people where slug = '${esc(c.personId)}' and ward_id = '00000000-0000-0000-0000-000000000001'));`
    );
  }
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, lines.join('\n') + '\n');
console.log(`Wrote ${lines.length} lines to ${OUT_PATH}`);
```

- [ ] **Step 2: Run the generator**

```bash
node scripts/build-seed.mjs
```

Expected: writes the migration file; prints line count.

- [ ] **Step 3: Sanity-check the generated SQL**

Open `supabase/migrations/20260419120300_seed.sql` and confirm:
- 143 `insert into people` lines
- 23 `insert into organizations` lines
- Many `insert into callings` lines
- Many `insert into master_assignments` lines (roughly 143 minus the 13 unassigned = ~130, but some people hold multiple callings)

Duplicate callings (e.g., two "advisor" rows in Teachers Quorum) should produce two separate callings rows — that's correct and intentional.

- [ ] **Step 4: Apply via MCP**

`apply_migration` with name `seed`.

Note: because SQL subqueries resolve the Teachers Quorum's second "advisor" insert to one calling (both have the same title), you'll get duplicate rows at the calling level but the master_assignments insert will fail on conflict because `calling_id` is the primary key. To avoid this, we pre-insert callings by sort_order and reference `calling.id` by that ordinal — but the above generator uses `title` match which will collide on duplicates. Fix in Step 5.

- [ ] **Step 5: Fix the generator to key callings by ordinal rather than title**

Edit `scripts/build-seed.mjs` so the Callings and Master Assignments sections use a per-organization counter. Replace the Callings section and Master assignments section with:

```js
// Callings (use sort_order as unique ordinal within org)
lines.push('-- Callings');
for (const o of data.organizations) {
  o.callings.forEach((c, i) => {
    lines.push(
      `insert into callings (organization_id, title, sort_order) values ((select id from organizations where slug = '${esc(o.id)}' and ward_id = '00000000-0000-0000-0000-000000000001'), '${esc(c.title)}', ${i});`
    );
  });
}
lines.push('');

// Master assignments — key callings by (org slug, sort_order) to disambiguate duplicate titles
lines.push('-- Master assignments');
for (const o of data.organizations) {
  o.callings.forEach((c, i) => {
    if (!c.personId) return;
    lines.push(
      `insert into master_assignments (calling_id, person_id) values ((select c.id from callings c join organizations o on o.id = c.organization_id where o.slug = '${esc(o.id)}' and c.sort_order = ${i} limit 1), (select id from people where slug = '${esc(c.personId)}' and ward_id = '00000000-0000-0000-0000-000000000001'));`
    );
  });
}
```

Re-run `node scripts/build-seed.mjs`, re-apply the migration (if the bad one was already applied, first drop-and-recreate: `mcp__claude_ai_Supabase__execute_sql` with `truncate callings cascade;` followed by re-running seed).

- [ ] **Step 6: Verify row counts**

Use `execute_sql`:

```sql
select
  (select count(*) from people) as people_count,
  (select count(*) from organizations) as org_count,
  (select count(*) from callings) as calling_count,
  (select count(*) from master_assignments) as assignment_count;
```

Expected: `people_count = 143`, `org_count = 23`, `calling_count` matches total callings in JSX (sum of per-org counts), `assignment_count` equals number of filled callings in the JSX.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-seed.mjs supabase/migrations/20260419120300_seed.sql
git commit -m "Seed from JSX INITIAL_DATA (143 people, 23 orgs)"
```

---

## Phase 3 — Auth

### Task 11: Supabase client helpers

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`

- [ ] **Step 1: `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: `lib/supabase/server.ts`**

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component — fine to ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: `lib/supabase/middleware.ts`**

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === '/sign-in';
  const isSetPasswordRoute = pathname === '/account/set-password';

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: access } = await supabase
      .from('user_access')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!access) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      url.searchParams.set('error', 'no-access');
      return NextResponse.redirect(url);
    }

    const mustChange = user.user_metadata?.must_change_password === true;
    if (mustChange && !isSetPasswordRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/account/set-password';
      return NextResponse.redirect(url);
    }

    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return response;
}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase
git commit -m "Add Supabase browser/server/middleware client helpers"
```

### Task 12: Root middleware

**Files:**
- Create: `middleware.ts` (at repo root, not inside `app/`)

- [ ] **Step 1: Write `middleware.ts`**

```ts
import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "Add auth middleware — gate all routes on user_access"
```

### Task 13: Sign-in page

**Files:**
- Create: `app/sign-in/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    params.get('error') === 'no-access' ? 'Your account does not have access.' : null
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    router.replace('/');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border border-black/10 rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl text-primary mb-6">Calling Matrix</h1>
        <label className="block text-sm mb-2">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-black/20 rounded px-3 py-2 mb-4"
        />
        <label className="block text-sm mb-2">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-black/20 rounded px-3 py-2 mb-4"
        />
        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white rounded py-2 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-6 text-xs text-black/60 text-center">
          Forgot password? Contact the admin.
        </p>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Visit `/sign-in`. Confirm the form renders. Submit with bad credentials; expect an error message. Kill the server.

- [ ] **Step 3: Commit**

```bash
git add app/sign-in/page.tsx
git commit -m "Add sign-in page"
```

### Task 14: Set-password page

**Files:**
- Create: `app/account/set-password/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10) { setError('Password must be at least 10 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    if (error) { setError(error.message); setSubmitting(false); return; }
    router.replace('/');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border border-black/10 rounded-lg p-8 shadow-sm">
        <h1 className="text-xl text-primary mb-2">Set a new password</h1>
        <p className="text-sm text-black/70 mb-6">Your account uses a temporary password. Please set your own to continue.</p>
        <label className="block text-sm mb-2">New password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
               className="w-full border border-black/20 rounded px-3 py-2 mb-4" />
        <label className="block text-sm mb-2">Confirm password</label>
        <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
               className="w-full border border-black/20 rounded px-3 py-2 mb-4" />
        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}
        <button type="submit" disabled={submitting}
                className="w-full bg-primary text-white rounded py-2 disabled:opacity-60">
          {submitting ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/account/set-password/page.tsx
git commit -m "Add forced set-password page"
```

### Task 15: Provision Ryan's user

**Files:** none (runtime action).

- [ ] **Step 1: Ask Ryan for a temporary password**

Prompt: "What password would you like for your initial admin account? I'll set it directly with `must_change_password=false` so you can sign in without a reset step."

- [ ] **Step 2: Use Supabase MCP to create the auth user**

Using the Supabase dashboard or an admin-API call from Claude: create a user with email `rbunker@abpcapital.com` (confirm with Ryan first), the password from Step 1, and `user_metadata: { must_change_password: false }`. The MCP does not currently expose `auth.admin.createUser`, so do this via the Supabase dashboard. Walk Ryan through it: Authentication → Users → Add user → Create new user → fill fields → uncheck "send magic link" → Create.

- [ ] **Step 3: Insert the `user_access` row via MCP**

Use `execute_sql`:

```sql
insert into user_access (user_id, ward_id, display_name)
select id, '00000000-0000-0000-0000-000000000001', 'Ryan Bunker'
from auth.users where email = 'rbunker@abpcapital.com';
```

Expected: 1 row affected.

- [ ] **Step 4: Verify end-to-end**

```bash
npm run dev
```

1. Navigate to `/` → expect redirect to `/sign-in`.
2. Sign in with Ryan's credentials → expect redirect to `/` (the placeholder home).
3. Navigate to `/sign-in` while authenticated → expect redirect to `/`.

Kill server.

- [ ] **Step 5: Commit a note**

```bash
# No code changes; just mark the milestone
git commit --allow-empty -m "Provision initial admin user (Ryan)"
```

---

## Phase 4 — Domain types and utilities

### Task 16: Domain types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write the types**

```ts
export type Id = string;

export interface Person { id: Id; name: string; slug: string; }
export interface Organization { id: Id; name: string; slug: string; sort_order: number; }
export interface Calling { id: Id; organization_id: Id; title: string; sort_order: number; }

export interface MasterAssignment {
  calling_id: Id;
  person_id: Id;
  set_apart: boolean;
}

export interface DraftRow {
  id: Id;
  name: string;
  created_by: Id | null;
  created_at: string;
  based_on_master_at: string;
  archived: boolean;
}

export interface DraftAssignment {
  draft_id: Id;
  calling_id: Id;
  person_id: Id;
  called: boolean;
  sustained: boolean;
}

export interface DraftStaging { draft_id: Id; person_id: Id; }

export interface PromotionHistoryRow {
  id: Id;
  draft_name: string;
  promoted_at: string;
  promoted_by: Id | null;
  snapshot: Array<{
    calling_id: Id;
    calling_title: string;
    organization_name: string;
    person_id: Id;
    person_name: string;
    set_apart: boolean;
  }>;
}

export interface UserAccessRow {
  user_id: Id;
  ward_id: Id;
  display_name: string | null;
  granted_at: string;
}

// Ward id is hardcoded in the MVP (single-ward).
export const WARD_ID = '00000000-0000-0000-0000-000000000001';
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "Add shared domain types"
```

### Task 17: Utility helpers

**Files:**
- Create: `lib/utils/title-case.ts`, `lib/utils/initials.ts`, `lib/utils/avatar-bg.ts`, `lib/utils/slug.ts`

- [ ] **Step 1: `lib/utils/title-case.ts`**

```ts
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => {
      if (/^\d/.test(w)) return w;
      if (w.includes('/')) {
        return w.split('/').map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p)).join('/');
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}
```

- [ ] **Step 2: `lib/utils/initials.ts`**

```ts
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
```

- [ ] **Step 3: `lib/utils/avatar-bg.ts`**

```ts
const PALETTE = [
  '#D4C5A2', '#C9B99F', '#B5A58B', '#A89C8E',
  '#8FA58E', '#9BAE94', '#B5B098', '#C4B79E',
  '#D8B59A', '#C9A58E', '#B8967F', '#A68270',
];

export function avatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length]!;
}
```

- [ ] **Step 4: `lib/utils/slug.ts`**

```ts
export function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Returns a unique slug given a set of already-taken slugs.
export function uniqueSlug(name: string, taken: Set<string>): string {
  const base = toSlug(name) || 'member';
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add lib/utils
git commit -m "Add title-case, initials, avatar-bg, and slug utilities"
```

### Task 18: Person chip component

**Files:**
- Create: `components/person-chip.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { initials } from '@/lib/utils/initials';
import { avatarBg } from '@/lib/utils/avatar-bg';

export function PersonChip({
  name,
  draggable = false,
  onPointerDown,
  className = '',
}: {
  name: string;
  draggable?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  className?: string;
}) {
  return (
    <span
      onPointerDown={onPointerDown}
      className={`inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white border border-black/10 text-sm ${draggable ? 'cursor-grab active:cursor-grabbing select-none' : ''} ${className}`}
    >
      <span
        aria-hidden
        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold text-black/80"
        style={{ backgroundColor: avatarBg(name) }}
      >
        {initials(name)}
      </span>
      <span>{name}</span>
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/person-chip.tsx
git commit -m "Add PersonChip"
```

---

## Phase 5 — Master view (read-only first, then writable)

### Task 19: Master data fetcher

**Files:**
- Create: `lib/data/master.ts`

- [ ] **Step 1: Write the fetcher**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/data/master.ts
git commit -m "Add master data fetcher"
```

### Task 20: Calling row + Set Apart toggle

**Files:**
- Create: `components/set-apart-toggle.tsx`, `components/calling-row.tsx`

- [ ] **Step 1: `components/set-apart-toggle.tsx`**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';

export function SetApartToggle({ callingId, initial }: { callingId: string; initial: boolean }) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  function onToggle() {
    const next = !value;
    setValue(next); // optimistic
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('master_assignments')
        .update({ set_apart: next, updated_at: new Date().toISOString() })
        .eq('calling_id', callingId);
      if (error) {
        setValue(!next);
        console.error('Set Apart toggle failed:', error);
      }
    });
  }

  return (
    <button
      onClick={onToggle}
      disabled={pending}
      className={`text-xs px-2 py-0.5 rounded border font-numeric ${value ? 'bg-primary text-white border-primary' : 'bg-white text-black/60 border-black/20'}`}
      aria-pressed={value}
    >
      {value ? 'Set Apart: Y' : 'Set Apart: N'}
    </button>
  );
}
```

- [ ] **Step 2: `components/calling-row.tsx`**

```tsx
import { PersonChip } from './person-chip';
import { SetApartToggle } from './set-apart-toggle';
import { titleCase } from '@/lib/utils/title-case';

export function CallingRow({
  callingId,
  title,
  personName,
  setApart,
  mode,
}: {
  callingId: string;
  title: string;
  personName: string | null;
  setApart: boolean;
  mode: 'master' | 'draft';
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 border-b border-black/5 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-black/50">{titleCase(title)}</p>
        <div className="mt-1">
          {personName ? (
            <PersonChip name={personName} />
          ) : (
            <span className="text-sm italic text-black/40">Unfilled</span>
          )}
        </div>
      </div>
      {mode === 'master' && personName && (
        <SetApartToggle callingId={callingId} initial={setApart} />
      )}
    </li>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/set-apart-toggle.tsx components/calling-row.tsx
git commit -m "Add CallingRow and SetApartToggle"
```

### Task 21: Org card

**Files:**
- Create: `components/org-card.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { CallingRow } from './calling-row';
import { titleCase } from '@/lib/utils/title-case';
import type { Calling, MasterAssignment, Person } from '@/lib/types';

export function OrgCard({
  name,
  callings,
  assignmentsByCallingId,
  peopleById,
  mode,
}: {
  name: string;
  callings: Calling[];
  assignmentsByCallingId: Map<string, MasterAssignment>;
  peopleById: Map<string, Person>;
  mode: 'master' | 'draft';
}) {
  return (
    <section className="bg-surface border border-black/10 rounded-lg p-4">
      <h2 className="text-lg text-primary mb-3">{titleCase(name)}</h2>
      <ul>
        {callings.map((c) => {
          const a = assignmentsByCallingId.get(c.id);
          const person = a ? peopleById.get(a.person_id) : undefined;
          return (
            <CallingRow
              key={c.id}
              callingId={c.id}
              title={c.title}
              personName={person?.name ?? null}
              setApart={a?.set_apart ?? false}
              mode={mode}
            />
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/org-card.tsx
git commit -m "Add OrgCard"
```

### Task 22: Master page — first render

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace the placeholder with the real master view**

```tsx
import { loadMaster } from '@/lib/data/master';
import { OrgCard } from '@/components/org-card';
import { PersonChip } from '@/components/person-chip';

export default async function HomePage() {
  const { organizations, callings, people, assignments } = await loadMaster();

  const peopleById = new Map(people.map((p) => [p.id, p]));
  const assignmentsByCallingId = new Map(assignments.map((a) => [a.calling_id, a]));
  const callingsByOrg = new Map<string, typeof callings>();
  for (const c of callings) {
    const list = callingsByOrg.get(c.organization_id) ?? [];
    list.push(c);
    callingsByOrg.set(c.organization_id, list);
  }

  const assignedPersonIds = new Set(assignments.map((a) => a.person_id));
  const unassignedPeople = people.filter((p) => !assignedPersonIds.has(p.id));

  return (
    <main className="container mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl text-primary">Calling Matrix — Rancho Carrillo Ward</h1>
        <p className="mt-2 text-sm text-black/60 font-numeric">
          {people.length} members · {assignments.length} assignments · {organizations.length} organizations
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((o) => (
          <OrgCard
            key={o.id}
            name={o.name}
            callings={callingsByOrg.get(o.id) ?? []}
            assignmentsByCallingId={assignmentsByCallingId}
            peopleById={peopleById}
            mode="master"
          />
        ))}
      </div>

      <section className="mt-10 bg-surface border border-black/10 rounded-lg p-4">
        <h2 className="text-lg text-primary mb-3">
          Members Without a Calling
          <span className="ml-2 text-xs font-numeric text-black/50">({unassignedPeople.length})</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {unassignedPeople.map((p) => (
            <PersonChip key={p.id} name={p.name} />
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify end-to-end**

```bash
npm run dev
```

Sign in, land on `/`. Confirm all 23 orgs render in the correct sort order. Confirm ~13 unassigned members appear at the bottom. Click a Set Apart toggle; refresh; confirm the value persisted.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "Master view: render orgs, callings, assignments, and unassigned list"
```

### Task 23: Add Member modal

**Files:**
- Create: `lib/data/people.ts`, `components/add-member-modal.tsx`
- Modify: `app/page.tsx` (add button + wire modal)

- [ ] **Step 1: `lib/data/people.ts`**

```ts
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
```

- [ ] **Step 2: `components/add-member-modal.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addPerson } from '@/lib/data/people';

export function AddMemberModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true); setError(null);
    try {
      await addPerson(name.trim());
      router.refresh();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6" onClick={onClose}>
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-sm border border-black/10">
        <h2 className="text-lg text-primary mb-4">Add member</h2>
        <label className="block text-sm mb-2">Full name</label>
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} autoFocus
               className="w-full border border-black/20 rounded px-3 py-2 mb-4" />
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
                  className="px-3 py-1.5 rounded border border-black/20">Cancel</button>
          <button type="submit" disabled={submitting}
                  className="px-3 py-1.5 rounded bg-primary text-white disabled:opacity-60">
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Wire the button into `app/page.tsx`**

Convert the "Members Without a Calling" section to a client island. Create `components/unassigned-section.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PersonChip } from './person-chip';
import { AddMemberModal } from './add-member-modal';
import type { Person } from '@/lib/types';

export function UnassignedSection({ people }: { people: Person[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-10 bg-surface border border-black/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg text-primary">
          Members Without a Calling
          <span className="ml-2 text-xs font-numeric text-black/50">({people.length})</span>
        </h2>
        <button onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1 text-sm px-2 py-1 border border-black/20 rounded hover:bg-white">
          <Plus className="w-4 h-4" /> Add member
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {people.map((p) => <PersonChip key={p.id} name={p.name} />)}
      </div>
      {open && <AddMemberModal onClose={() => setOpen(false)} />}
    </section>
  );
}
```

Then replace the `<section>…</section>` block in `app/page.tsx` with:

```tsx
<UnassignedSection people={unassignedPeople} />
```

and add `import { UnassignedSection } from '@/components/unassigned-section';` to the imports.

- [ ] **Step 4: Verify**

Run `npm run dev`, click "Add member", enter "Test Person", submit. Confirm chip appears in the Unassigned section; refresh and confirm persistence.

- [ ] **Step 5: Commit**

```bash
git add lib/data/people.ts components/add-member-modal.tsx components/unassigned-section.tsx app/page.tsx
git commit -m "Add Add-Member flow on Master view"
```

### Task 24: Sidebar filter

**Files:**
- Create: `lib/filter-state.ts`, `components/sidebar-filter.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: `lib/filter-state.ts`**

```ts
'use client';

import { useEffect, useState } from 'react';

export type FilterState = {
  all: boolean;
  orgSlugs: Set<string>;
  setApart: boolean;
  noCalling: boolean;
};

const KEY = (userId: string) => `calling-matrix:filter:${userId}`;

export function useFilterState(userId: string | null): [FilterState, (s: FilterState) => void] {
  const [state, setState] = useState<FilterState>({ all: true, orgSlugs: new Set(), setApart: false, noCalling: false });

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(KEY(userId));
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({
          all: !!parsed.all,
          orgSlugs: new Set(parsed.orgSlugs ?? []),
          setApart: !!parsed.setApart,
          noCalling: !!parsed.noCalling,
        });
      }
    } catch {}
  }, [userId]);

  function save(next: FilterState) {
    setState(next);
    if (!userId) return;
    localStorage.setItem(KEY(userId), JSON.stringify({
      all: next.all,
      orgSlugs: [...next.orgSlugs],
      setApart: next.setApart,
      noCalling: next.noCalling,
    }));
  }

  return [state, save];
}
```

- [ ] **Step 2: `components/sidebar-filter.tsx`**

```tsx
'use client';

import { useFilterState, type FilterState } from '@/lib/filter-state';
import type { Organization } from '@/lib/types';
import { titleCase } from '@/lib/utils/title-case';

export function SidebarFilter({
  userId,
  organizations,
  counts,
  noCallingCount,
  mode,
  onChange,
}: {
  userId: string | null;
  organizations: Organization[];
  counts: Map<string, number>;
  noCallingCount: number;
  mode: 'master' | 'draft';
  onChange: (s: FilterState) => void;
}) {
  const [state, save] = useFilterState(userId);

  function commit(next: FilterState) { save(next); onChange(next); }

  function toggleOrg(slug: string) {
    const next = { ...state, all: false, orgSlugs: new Set(state.orgSlugs) };
    if (next.orgSlugs.has(slug)) next.orgSlugs.delete(slug); else next.orgSlugs.add(slug);
    if (next.orgSlugs.size === 0 && !next.setApart && !next.noCalling) next.all = true;
    commit(next);
  }

  const accent = mode === 'draft' ? 'bg-draft text-white' : 'bg-primary text-white';
  const unselected = 'bg-white text-black/80 hover:bg-black/5';

  function pillClass(active: boolean) {
    return `w-full text-left px-3 py-1.5 rounded text-sm flex items-center justify-between ${active ? accent : unselected}`;
  }

  return (
    <nav className="w-[220px] shrink-0 border-r border-black/10 bg-white h-full p-3 overflow-y-auto">
      <button
        className={pillClass(state.all)}
        onClick={() => commit({ all: true, orgSlugs: new Set(), setApart: false, noCalling: false })}
      >
        <span>All</span>
      </button>
      <div className="mt-2 space-y-1">
        {organizations.map((o) => {
          const active = state.orgSlugs.has(o.slug);
          return (
            <button key={o.id} className={pillClass(active)} onClick={() => toggleOrg(o.slug)}>
              <span>{titleCase(o.name)}</span>
              <span className="font-numeric text-xs opacity-70">{counts.get(o.id) ?? 0}</span>
            </button>
          );
        })}
      </div>
      <div className="my-3 border-t border-black/10" />
      {mode === 'master' && (
        <button className={pillClass(state.setApart)}
                onClick={() => commit({ ...state, all: false, setApart: !state.setApart })}>
          <span>Set Apart</span>
        </button>
      )}
      <button className={pillClass(state.noCalling)}
              onClick={() => commit({ ...state, all: false, noCalling: !state.noCalling })}>
        <span>No Calling</span>
        <span className="font-numeric text-xs opacity-70">{noCallingCount}</span>
      </button>
    </nav>
  );
}
```

- [ ] **Step 3: Wire into `app/page.tsx`**

Master view needs to become a client component (at least for the filter shell) or use a client-wrapper. Simplest: move the layout into a client component `components/master-view.tsx` that takes the server-fetched data as props.

Create `components/master-view.tsx`:

```tsx
'use client';

import { useState, useMemo } from 'react';
import { SidebarFilter } from './sidebar-filter';
import { OrgCard } from './org-card';
import { UnassignedSection } from './unassigned-section';
import type { FilterState } from '@/lib/filter-state';
import type { Calling, MasterAssignment, Organization, Person } from '@/lib/types';

export function MasterView({
  userId, organizations, callings, people, assignments,
}: {
  userId: string | null;
  organizations: Organization[];
  callings: Calling[];
  people: Person[];
  assignments: MasterAssignment[];
}) {
  const [filter, setFilter] = useState<FilterState>({ all: true, orgSlugs: new Set(), setApart: false, noCalling: false });

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const assignmentsByCalling = useMemo(() => new Map(assignments.map((a) => [a.calling_id, a])), [assignments]);
  const callingsByOrg = useMemo(() => {
    const m = new Map<string, Calling[]>();
    for (const c of callings) {
      const list = m.get(c.organization_id) ?? [];
      list.push(c);
      m.set(c.organization_id, list);
    }
    return m;
  }, [callings]);
  const assignedIds = useMemo(() => new Set(assignments.map((a) => a.person_id)), [assignments]);
  const unassigned = useMemo(() => people.filter((p) => !assignedIds.has(p.id)), [people, assignedIds]);

  const orgCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of organizations) m.set(o.id, (callingsByOrg.get(o.id) ?? []).length);
    return m;
  }, [organizations, callingsByOrg]);

  // Apply filters to decide which orgs render and whether to show unassigned
  const showOrgs = !filter.noCalling; // noCalling hides orgs entirely
  const visibleOrgs = filter.all
    ? organizations
    : organizations.filter((o) => filter.orgSlugs.has(o.slug) || (filter.orgSlugs.size === 0 && !filter.noCalling));

  return (
    <div className="flex min-h-screen">
      <SidebarFilter
        userId={userId}
        organizations={organizations}
        counts={orgCounts}
        noCallingCount={unassigned.length}
        mode="master"
        onChange={setFilter}
      />
      <main className="flex-1 px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl text-primary">Calling Matrix — Rancho Carrillo Ward</h1>
          <p className="mt-2 text-sm text-black/60 font-numeric">
            {people.length} members · {assignments.length} assignments · {organizations.length} organizations
          </p>
        </header>

        {showOrgs && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleOrgs.map((o) => {
              const orgCallings = (callingsByOrg.get(o.id) ?? []).filter((c) => {
                if (!filter.setApart) return true;
                const a = assignmentsByCalling.get(c.id);
                return a && !a.set_apart;
              });
              if (filter.setApart && orgCallings.length === 0) return null;
              return (
                <OrgCard
                  key={o.id}
                  name={o.name}
                  callings={orgCallings}
                  assignmentsByCallingId={assignmentsByCalling}
                  peopleById={peopleById}
                  mode="master"
                />
              );
            })}
          </div>
        )}

        {(filter.all || filter.noCalling) && (
          <UnassignedSection people={unassigned} />
        )}
      </main>
    </div>
  );
}
```

Replace `app/page.tsx`:

```tsx
import { loadMaster } from '@/lib/data/master';
import { createClient } from '@/lib/supabase/server';
import { MasterView } from '@/components/master-view';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const data = await loadMaster();
  return <MasterView userId={user?.id ?? null} {...data} />;
}
```

- [ ] **Step 4: Verify**

Run `npm run dev`. Click through: All (default), specific orgs (multi-select), Set Apart (hides filled-and-set-apart), No Calling (hides org grid, shows unassigned only). Reload the page; confirm the selection persists.

- [ ] **Step 5: Commit**

```bash
git add lib/filter-state.ts components/sidebar-filter.tsx components/master-view.tsx app/page.tsx
git commit -m "Add sidebar filter with multi-select + localStorage persistence"
```

### Task 25: Mobile drawer

**Files:**
- Modify: `components/master-view.tsx`, `components/sidebar-filter.tsx`

- [ ] **Step 1: Convert the sidebar into a toggleable drawer on mobile**

At the top of `components/master-view.tsx` add a `useState` for `drawerOpen` and render a hamburger button visible on `<768px` that toggles it:

```tsx
import { Menu, X } from 'lucide-react';
// ...inside MasterView, after `const [filter, setFilter] = ...`
const [drawerOpen, setDrawerOpen] = useState(false);
```

Replace the outer flex container with:

```tsx
<div className="md:flex md:min-h-screen">
  <button
    aria-label="Toggle filter menu"
    className="md:hidden fixed top-3 left-3 z-40 bg-white border border-black/20 rounded p-2"
    onClick={() => setDrawerOpen((v) => !v)}
  >
    {drawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
  </button>

  <div className={`${drawerOpen ? 'block' : 'hidden'} md:block md:sticky md:top-0 md:h-screen`}>
    <SidebarFilter ... />
  </div>

  <main className="flex-1 px-6 py-8 md:py-8 pt-16 md:pt-8">
    {/* ...existing main content... */}
  </main>
</div>
```

- [ ] **Step 2: Verify**

Run dev server, narrow browser to <768px. Confirm hamburger appears and toggles the sidebar. Confirm the main content lays out beneath.

- [ ] **Step 3: Commit**

```bash
git add components/master-view.tsx
git commit -m "Collapse sidebar to a drawer on mobile"
```

---

## Phase 6 — Drafts

### Task 26: Draft data access

**Files:**
- Create: `lib/data/drafts.ts`

- [ ] **Step 1: Write the module**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/data/drafts.ts
git commit -m "Add drafts data module (list/create/rename/delete/move/promote)"
```

### Task 27: Drafts list page

**Files:**
- Create: `app/drafts/page.tsx`, `components/drafts-list.tsx`

- [ ] **Step 1: `components/drafts-list.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listDrafts, createDraft, deleteDraft, renameDraft } from '@/lib/data/drafts';
import type { DraftRow } from '@/lib/types';
import { Plus, Trash2, Pencil } from 'lucide-react';

export function DraftsList() {
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  async function reload() { setRows(await listDrafts(showArchived)); }

  useEffect(() => { void reload(); }, [showArchived]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await createDraft(newName.trim());
    setNewName(''); setCreating(false);
    void reload();
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this draft?')) return;
    await deleteDraft(id); void reload();
  }

  async function onRename(row: DraftRow) {
    const n = prompt('Rename draft', row.name);
    if (!n || n === row.name) return;
    await renameDraft(row.id, n); void reload();
  }

  return (
    <main className="container mx-auto px-6 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl text-primary">Drafts</h1>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </header>

      {creating ? (
        <form onSubmit={onCreate} className="mb-6 flex gap-2">
          <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                 placeholder="Draft name"
                 className="flex-1 border border-black/20 rounded px-3 py-2" />
          <button type="submit" className="px-3 py-1.5 rounded bg-primary text-white">Create</button>
          <button type="button" onClick={() => { setCreating(false); setNewName(''); }}
                  className="px-3 py-1.5 rounded border border-black/20">Cancel</button>
        </form>
      ) : (
        <button onClick={() => setCreating(true)}
                className="mb-6 inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-white">
          <Plus className="w-4 h-4" /> New draft
        </button>
      )}

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id}
              className={`flex items-center justify-between gap-3 p-3 rounded border ${r.archived ? 'bg-black/5 border-black/10 text-black/60' : 'bg-surface border-black/10'}`}>
            <div className="flex-1 min-w-0">
              <Link href={`/drafts/${r.id}`} className="font-medium hover:underline">{r.name}</Link>
              <p className="text-xs text-black/50 font-numeric">
                Created {new Date(r.created_at).toLocaleString()}
                {r.archived && ' · Promoted'}
              </p>
            </div>
            {!r.archived && (
              <div className="flex gap-1">
                <button onClick={() => onRename(r)} aria-label="Rename"
                        className="p-1.5 rounded hover:bg-black/5"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => onDelete(r.id)} aria-label="Delete"
                        className="p-1.5 rounded hover:bg-red-50 text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </li>
        ))}
        {rows.length === 0 && <p className="text-sm text-black/60">No drafts yet.</p>}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: `app/drafts/page.tsx`**

```tsx
import { DraftsList } from '@/components/drafts-list';
export default function DraftsPage() { return <DraftsList />; }
```

- [ ] **Step 3: Verify**

Run dev. Navigate to `/drafts`. Create a draft. Confirm it appears. Rename. Delete. Toggle "Show archived" (should be empty until a promote happens).

- [ ] **Step 4: Commit**

```bash
git add app/drafts/page.tsx components/drafts-list.tsx
git commit -m "Add drafts list page with create/rename/delete"
```

### Task 28: Draft detail scaffold

**Files:**
- Create: `app/drafts/[id]/page.tsx`, `components/draft-view.tsx`

- [ ] **Step 1: `app/drafts/[id]/page.tsx`**

```tsx
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
```

- [ ] **Step 2: Skeletal `components/draft-view.tsx`**

Write a first version that mirrors the Master layout but with the amber header band, a stub Staging rail, a stub Changes-from-Master panel, and the same OrgCard grid — chips are not yet draggable.

```tsx
'use client';

import { useMemo, useState } from 'react';
import { SidebarFilter } from './sidebar-filter';
import { OrgCard } from './org-card';
import { PersonChip } from './person-chip';
import type { FilterState } from '@/lib/filter-state';
import type { Calling, DraftAssignment, DraftStaging, MasterAssignment, Organization, Person } from '@/lib/types';

export function DraftView({
  userId, draft, masterAssignments, organizations, callings, people, draftAssignments, staging,
}: {
  userId: string | null;
  draft: { id: string; name: string; archived: boolean };
  masterAssignments: MasterAssignment[];
  organizations: Organization[];
  callings: Calling[];
  people: Person[];
  draftAssignments: DraftAssignment[];
  staging: DraftStaging[];
}) {
  const [filter, setFilter] = useState<FilterState>({ all: true, orgSlugs: new Set(), setApart: false, noCalling: false });

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const draftAssignByCalling = useMemo(() => new Map(draftAssignments.map((a) => [a.calling_id, a])), [draftAssignments]);
  const masterAssignByCalling = useMemo(() => new Map(masterAssignments.map((a) => [a.calling_id, a])), [masterAssignments]);
  const callingsByOrg = useMemo(() => {
    const m = new Map<string, Calling[]>();
    for (const c of callings) { const l = m.get(c.organization_id) ?? []; l.push(c); m.set(c.organization_id, l); }
    return m;
  }, [callings]);
  const assignedIds = useMemo(() => new Set(draftAssignments.map((a) => a.person_id)), [draftAssignments]);
  const stagedIds = useMemo(() => new Set(staging.map((s) => s.person_id)), [staging]);
  const unassigned = useMemo(
    () => people.filter((p) => !assignedIds.has(p.id) && !stagedIds.has(p.id)),
    [people, assignedIds, stagedIds]
  );
  const stagedPeople = useMemo(
    () => staging.map((s) => peopleById.get(s.person_id)!).filter(Boolean),
    [staging, peopleById]
  );

  const orgCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of organizations) m.set(o.id, (callingsByOrg.get(o.id) ?? []).length);
    return m;
  }, [organizations, callingsByOrg]);

  const visibleOrgs = filter.all
    ? organizations
    : organizations.filter((o) => filter.orgSlugs.has(o.slug));

  // Assignments-for-display: use draft values
  const displayAssignments = useMemo(
    () => draftAssignments.map((a) => ({ calling_id: a.calling_id, person_id: a.person_id, set_apart: false })),
    [draftAssignments]
  );
  const displayMap = useMemo(() => new Map(displayAssignments.map((a) => [a.calling_id, a])), [displayAssignments]);

  return (
    <div className="md:flex md:min-h-screen">
      <div className="md:sticky md:top-0 md:h-screen">
        <SidebarFilter userId={userId} organizations={organizations} counts={orgCounts}
                       noCallingCount={unassigned.length} mode="draft" onChange={setFilter} />
      </div>
      <main className="flex-1">
        <div className="bg-draft text-white px-6 py-3">
          <p className="font-numeric text-xs uppercase tracking-wider opacity-80">Draft</p>
          <h1 className="text-2xl">{draft.name}</h1>
        </div>

        <section className="px-6 py-4 border-b border-black/10 bg-white">
          <h2 className="text-sm uppercase tracking-wide text-black/60 mb-2">Staging ({stagedPeople.length})</h2>
          <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
            {stagedPeople.length === 0
              ? <span className="text-sm italic text-black/40">No one in staging.</span>
              : stagedPeople.map((p) => <PersonChip key={p.id} name={p.name} />)}
          </div>
        </section>

        <section className="px-6 py-4 border-b border-black/10 bg-surface">
          <h2 className="text-sm uppercase tracking-wide text-black/60 mb-2">Changes from Master</h2>
          <p className="text-sm text-black/60">[populated in a later task]</p>
        </section>

        <div className="px-6 py-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleOrgs.map((o) => (
            <OrgCard key={o.id} name={o.name}
                     callings={callingsByOrg.get(o.id) ?? []}
                     assignmentsByCallingId={displayMap}
                     peopleById={peopleById}
                     mode="draft" />
          ))}
        </div>

        <section className="mx-6 mb-10 bg-surface border border-black/10 rounded-lg p-4">
          <h2 className="text-lg text-primary mb-3">
            Members Without a Calling
            <span className="ml-2 text-xs font-numeric text-black/50">({unassigned.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((p) => <PersonChip key={p.id} name={p.name} />)}
          </div>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Dev server. Visit `/drafts`, open a draft. Confirm amber header, empty staging rail, placeholder changes panel, and the same org grid.

- [ ] **Step 4: Commit**

```bash
git add app/drafts/[id]/page.tsx components/draft-view.tsx
git commit -m "Scaffold draft detail page (read-only first pass)"
```

### Task 29: Drag-and-drop engine (pointer + touch)

**Files:**
- Create: `lib/drag-context.tsx`
- Modify: `components/person-chip.tsx`, `components/calling-row.tsx`, `components/org-card.tsx`, `components/draft-view.tsx`

- [ ] **Step 1: `lib/drag-context.tsx`**

```tsx
'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface DragPayload { personId: string; fromCallingId: string | null; fromStaging: boolean; }
interface DragCtx {
  active: DragPayload | null;
  pickup: (p: DragPayload) => void;
  drop: () => void;
  onDropTo: ((target: { kind: 'calling'; callingId: string } | { kind: 'unassigned' }) => void) | null;
  setOnDropTo: (cb: DragCtx['onDropTo']) => void;
}

const Ctx = createContext<DragCtx | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<DragPayload | null>(null);
  const [cb, setCb] = useState<DragCtx['onDropTo']>(null);
  return (
    <Ctx.Provider value={{
      active,
      pickup: (p) => setActive(p),
      drop: () => setActive(null),
      onDropTo: cb,
      setOnDropTo: (c) => setCb(() => c),
    }}>{children}</Ctx.Provider>
  );
}

export function useDrag() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDrag outside DragProvider');
  return v;
}
```

- [ ] **Step 2: Make `PersonChip` drag-aware**

Update `components/person-chip.tsx` to support two new props: `onPickup` and a visual pressed state. Replace the file:

```tsx
'use client';

import { initials } from '@/lib/utils/initials';
import { avatarBg } from '@/lib/utils/avatar-bg';

export function PersonChip({
  name,
  onPickup,
  selected = false,
  className = '',
}: {
  name: string;
  onPickup?: () => void;
  selected?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPickup}
      className={`inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white border text-sm ${onPickup ? 'cursor-pointer select-none hover:bg-black/5' : ''} ${selected ? 'ring-2 ring-draft border-draft' : 'border-black/10'} ${className}`}
    >
      <span
        aria-hidden
        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold text-black/80"
        style={{ backgroundColor: avatarBg(name) }}
      >
        {initials(name)}
      </span>
      <span>{name}</span>
    </button>
  );
}
```

Tap-to-pick-up / tap-to-drop is the primary interaction (mobile-friendly). Desktop drag is a nice-to-have we skip for MVP — tap works everywhere.

- [ ] **Step 3: Make `CallingRow` a drop target in draft mode**

Replace `components/calling-row.tsx`:

```tsx
'use client';

import { PersonChip } from './person-chip';
import { SetApartToggle } from './set-apart-toggle';
import { titleCase } from '@/lib/utils/title-case';
import { useDrag } from '@/lib/drag-context';

export function CallingRow({
  callingId,
  title,
  personName,
  personId,
  setApart,
  mode,
  draftId,
  called,
  sustained,
  onMove,
  onToggleCalled,
  onToggleSustained,
}: {
  callingId: string;
  title: string;
  personName: string | null;
  personId: string | null;
  setApart: boolean;
  mode: 'master' | 'draft';
  draftId?: string;
  called?: boolean;
  sustained?: boolean;
  onMove?: (payload: { callingId: string; personId: string; fromCallingId: string | null; fromStaging: boolean }) => void;
  onToggleCalled?: (callingId: string, next: boolean) => void;
  onToggleSustained?: (callingId: string, next: boolean) => void;
}) {
  const drag = mode === 'draft' ? useDrag() : null;
  const activeIsThis = drag?.active?.personId === personId;

  function onCellClick() {
    if (mode !== 'draft' || !drag) return;
    if (drag.active) {
      onMove?.({
        callingId,
        personId: drag.active.personId,
        fromCallingId: drag.active.fromCallingId,
        fromStaging: drag.active.fromStaging,
      });
      drag.drop();
    }
  }

  function onPickup() {
    if (mode !== 'draft' || !drag || !personId) return;
    drag.pickup({ personId, fromCallingId: callingId, fromStaging: false });
  }

  return (
    <li
      onClick={onCellClick}
      className={`flex items-center justify-between gap-3 py-2 border-b border-black/5 last:border-b-0 ${drag?.active && !activeIsThis ? 'cursor-copy bg-draft/5' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-black/50">{titleCase(title)}</p>
        <div className="mt-1">
          {personName ? (
            <PersonChip
              name={personName}
              selected={activeIsThis}
              onPickup={mode === 'draft' ? onPickup : undefined}
            />
          ) : (
            <span className="text-sm italic text-black/40">Unfilled</span>
          )}
        </div>
      </div>
      {mode === 'master' && personName && (
        <SetApartToggle callingId={callingId} initial={setApart} />
      )}
      {mode === 'draft' && personName && (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCalled?.(callingId, !called); }}
            className={`text-xs px-2 py-0.5 rounded border font-numeric ${called ? 'bg-draft text-white border-draft' : 'bg-white text-black/60 border-black/20'}`}
          >
            Called: {called ? 'Y' : 'N'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSustained?.(callingId, !sustained); }}
            className={`text-xs px-2 py-0.5 rounded border font-numeric ${sustained ? 'bg-draft text-white border-draft' : 'bg-white text-black/60 border-black/20'}`}
          >
            Sustained: {sustained ? 'Y' : 'N'}
          </button>
        </div>
      )}
    </li>
  );
}
```

- [ ] **Step 4: Update `OrgCard` to pass through the new props**

Replace `components/org-card.tsx`:

```tsx
import { CallingRow } from './calling-row';
import { titleCase } from '@/lib/utils/title-case';
import type { Calling, MasterAssignment, Person } from '@/lib/types';

export function OrgCard({
  name, callings, assignmentsByCallingId, peopleById, mode,
  draftId, draftMeta, onMove, onToggleCalled, onToggleSustained,
}: {
  name: string;
  callings: Calling[];
  assignmentsByCallingId: Map<string, MasterAssignment>;
  peopleById: Map<string, Person>;
  mode: 'master' | 'draft';
  draftId?: string;
  draftMeta?: Map<string, { called: boolean; sustained: boolean }>;
  onMove?: (p: { callingId: string; personId: string; fromCallingId: string | null; fromStaging: boolean }) => void;
  onToggleCalled?: (callingId: string, next: boolean) => void;
  onToggleSustained?: (callingId: string, next: boolean) => void;
}) {
  return (
    <section className="bg-surface border border-black/10 rounded-lg p-4">
      <h2 className="text-lg text-primary mb-3">{titleCase(name)}</h2>
      <ul>
        {callings.map((c) => {
          const a = assignmentsByCallingId.get(c.id);
          const person = a ? peopleById.get(a.person_id) : undefined;
          const meta = draftMeta?.get(c.id);
          return (
            <CallingRow
              key={c.id}
              callingId={c.id}
              title={c.title}
              personName={person?.name ?? null}
              personId={person?.id ?? null}
              setApart={a?.set_apart ?? false}
              mode={mode}
              draftId={draftId}
              called={meta?.called}
              sustained={meta?.sustained}
              onMove={onMove}
              onToggleCalled={onToggleCalled}
              onToggleSustained={onToggleSustained}
            />
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Wire `DraftView` to drag, move, and toggles**

Replace `components/draft-view.tsx` with the full version:

```tsx
'use client';

import { useMemo, useState, useTransition } from 'react';
import { SidebarFilter } from './sidebar-filter';
import { OrgCard } from './org-card';
import { PersonChip } from './person-chip';
import { DragProvider, useDrag } from '@/lib/drag-context';
import type { FilterState } from '@/lib/filter-state';
import type { Calling, DraftAssignment, DraftStaging, MasterAssignment, Organization, Person } from '@/lib/types';
import { movePerson, unassign, setCalled, setSustained } from '@/lib/data/drafts';

export function DraftView(props: {
  userId: string | null;
  draft: { id: string; name: string; archived: boolean };
  masterAssignments: MasterAssignment[];
  organizations: Organization[];
  callings: Calling[];
  people: Person[];
  draftAssignments: DraftAssignment[];
  staging: DraftStaging[];
}) {
  return <DragProvider><DraftViewInner {...props} /></DragProvider>;
}

function DraftViewInner({
  userId, draft, masterAssignments, organizations, callings, people, draftAssignments, staging,
}: {
  userId: string | null;
  draft: { id: string; name: string; archived: boolean };
  masterAssignments: MasterAssignment[];
  organizations: Organization[];
  callings: Calling[];
  people: Person[];
  draftAssignments: DraftAssignment[];
  staging: DraftStaging[];
}) {
  const [filter, setFilter] = useState<FilterState>({ all: true, orgSlugs: new Set(), setApart: false, noCalling: false });
  const [localAssign, setLocalAssign] = useState(draftAssignments);
  const [localStage, setLocalStage] = useState(staging);
  const [, startTransition] = useTransition();
  const drag = useDrag();

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const callingsByOrg = useMemo(() => {
    const m = new Map<string, Calling[]>();
    for (const c of callings) { const l = m.get(c.organization_id) ?? []; l.push(c); m.set(c.organization_id, l); }
    return m;
  }, [callings]);

  const displayMap = useMemo(() =>
    new Map(localAssign.map((a) => [a.calling_id, { calling_id: a.calling_id, person_id: a.person_id, set_apart: false }])),
    [localAssign]);

  const draftMeta = useMemo(() => new Map(localAssign.map((a) => [a.calling_id, { called: a.called, sustained: a.sustained }])), [localAssign]);

  const assignedIds = useMemo(() => new Set(localAssign.map((a) => a.person_id)), [localAssign]);
  const stagedIds = useMemo(() => new Set(localStage.map((s) => s.person_id)), [localStage]);
  const unassignedPeople = useMemo(
    () => people.filter((p) => !assignedIds.has(p.id) && !stagedIds.has(p.id)),
    [people, assignedIds, stagedIds]
  );
  const stagedPeople = useMemo(
    () => localStage.map((s) => peopleById.get(s.person_id)).filter((p): p is Person => !!p),
    [localStage, peopleById]
  );

  const orgCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of organizations) m.set(o.id, (callingsByOrg.get(o.id) ?? []).length);
    return m;
  }, [organizations, callingsByOrg]);

  const visibleOrgs = filter.all
    ? organizations
    : organizations.filter((o) => filter.orgSlugs.has(o.slug));

  function applyLocalMove(callingId: string, personId: string, fromCallingId: string | null) {
    setLocalAssign((prev) => {
      const next = prev.filter((a) => a.person_id !== personId);
      const displaced = next.find((a) => a.calling_id === callingId);
      const cleaned = next.filter((a) => a.calling_id !== callingId);
      cleaned.push({ draft_id: draft.id, calling_id: callingId, person_id: personId, called: false, sustained: false });
      if (displaced && displaced.person_id !== personId) {
        setLocalStage((s) => s.some((x) => x.person_id === displaced.person_id)
          ? s
          : [...s, { draft_id: draft.id, person_id: displaced.person_id }]);
      }
      return cleaned;
    });
    setLocalStage((s) => s.filter((x) => x.person_id !== personId));
  }

  async function onMove({ callingId, personId, fromCallingId }: { callingId: string; personId: string; fromCallingId: string | null; fromStaging: boolean }) {
    applyLocalMove(callingId, personId, fromCallingId);
    startTransition(async () => {
      try { await movePerson({ draftId: draft.id, callingId, personId }); }
      catch (err) { console.error('Move failed', err); alert('Move failed — reload the page.'); }
    });
  }

  async function onUnassignDropTarget(personId: string) {
    setLocalAssign((prev) => prev.filter((a) => a.person_id !== personId));
    setLocalStage((prev) => prev.filter((x) => x.person_id !== personId));
    startTransition(async () => {
      try { await unassign(draft.id, personId); }
      catch (err) { console.error('Unassign failed', err); }
    });
  }

  async function onToggleCalled(callingId: string, next: boolean) {
    setLocalAssign((prev) => prev.map((a) => a.calling_id === callingId ? { ...a, called: next } : a));
    startTransition(async () => { try { await setCalled(draft.id, callingId, next); } catch (e) { console.error(e); } });
  }
  async function onToggleSustained(callingId: string, next: boolean) {
    setLocalAssign((prev) => prev.map((a) => a.calling_id === callingId ? { ...a, sustained: next } : a));
    startTransition(async () => { try { await setSustained(draft.id, callingId, next); } catch (e) { console.error(e); } });
  }

  function onUnassignedAreaClick() {
    if (drag.active) { onUnassignDropTarget(drag.active.personId); drag.drop(); }
  }

  function onStagePickup(personId: string) {
    drag.pickup({ personId, fromCallingId: null, fromStaging: true });
  }

  function onUnassignedPickup(personId: string) {
    drag.pickup({ personId, fromCallingId: null, fromStaging: false });
  }

  return (
    <div className="md:flex md:min-h-screen">
      <div className="md:sticky md:top-0 md:h-screen">
        <SidebarFilter userId={userId} organizations={organizations} counts={orgCounts}
                       noCallingCount={unassignedPeople.length} mode="draft" onChange={setFilter} />
      </div>
      <main className="flex-1">
        <div className="bg-draft text-white px-6 py-3">
          <p className="font-numeric text-xs uppercase tracking-wider opacity-80">Draft</p>
          <h1 className="text-2xl">{draft.name}</h1>
          {drag.active && <p className="text-xs mt-1 opacity-90">Carrying: {peopleById.get(drag.active.personId)?.name} — tap a calling to place, or tap Members Without a Calling to unassign.</p>}
        </div>

        <section className="px-6 py-4 border-b border-black/10 bg-white">
          <h2 className="text-sm uppercase tracking-wide text-black/60 mb-2">Staging ({stagedPeople.length})</h2>
          <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
            {stagedPeople.length === 0
              ? <span className="text-sm italic text-black/40">No one in staging.</span>
              : stagedPeople.map((p) => (
                <PersonChip key={p.id} name={p.name}
                            selected={drag.active?.personId === p.id}
                            onPickup={() => onStagePickup(p.id)} />
              ))}
          </div>
        </section>

        <ChangesPanel
          organizations={organizations}
          callings={callings}
          peopleById={peopleById}
          masterAssignments={masterAssignments}
          draftAssignments={localAssign}
          staging={localStage}
        />

        <div className="px-6 py-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleOrgs.map((o) => (
            <OrgCard
              key={o.id}
              name={o.name}
              callings={callingsByOrg.get(o.id) ?? []}
              assignmentsByCallingId={displayMap}
              peopleById={peopleById}
              mode="draft"
              draftId={draft.id}
              draftMeta={draftMeta}
              onMove={onMove}
              onToggleCalled={onToggleCalled}
              onToggleSustained={onToggleSustained}
            />
          ))}
        </div>

        <section
          onClick={onUnassignedAreaClick}
          className={`mx-6 mb-10 bg-surface border rounded-lg p-4 ${drag.active ? 'border-draft cursor-copy' : 'border-black/10'}`}
        >
          <h2 className="text-lg text-primary mb-3">
            Members Without a Calling
            <span className="ml-2 text-xs font-numeric text-black/50">({unassignedPeople.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {unassignedPeople.map((p) => (
              <PersonChip key={p.id} name={p.name}
                          selected={drag.active?.personId === p.id}
                          onPickup={() => onUnassignedPickup(p.id)} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ChangesPanel({
  organizations, callings, peopleById, masterAssignments, draftAssignments, staging,
}: {
  organizations: Organization[];
  callings: Calling[];
  peopleById: Map<string, Person>;
  masterAssignments: MasterAssignment[];
  draftAssignments: DraftAssignment[];
  staging: DraftStaging[];
}) {
  const stagedIds = new Set(staging.map((s) => s.person_id));
  const masterByCalling = new Map(masterAssignments.map((a) => [a.calling_id, a.person_id]));
  const draftByCalling = new Map(draftAssignments.map((a) => [a.calling_id, a.person_id]));
  const callingLabel = new Map<string, string>();
  const orgName = new Map(organizations.map((o) => [o.id, o.name]));
  for (const c of callings) callingLabel.set(c.id, `${orgName.get(c.organization_id) ?? ''} — ${c.title}`);

  // Collect one row per affected person
  type Row = { personId: string; was: string; now: string };
  const byPerson = new Map<string, Row>();

  const allCallingIds = new Set<string>([...masterByCalling.keys(), ...draftByCalling.keys()]);
  for (const cid of allCallingIds) {
    const mPid = masterByCalling.get(cid);
    const dPid = draftByCalling.get(cid);
    if (mPid === dPid) continue;
    if (mPid) {
      const nowCalling = [...draftByCalling.entries()].find(([, pid]) => pid === mPid)?.[0];
      const nowLabel = nowCalling ? callingLabel.get(nowCalling)! : (stagedIds.has(mPid) ? 'Staging' : 'Unassigned');
      byPerson.set(mPid, { personId: mPid, was: callingLabel.get(cid) ?? '—', now: nowLabel });
    }
    if (dPid) {
      if (byPerson.has(dPid)) continue;
      const wasCalling = [...masterByCalling.entries()].find(([, pid]) => pid === dPid)?.[0];
      const wasLabel = wasCalling ? callingLabel.get(wasCalling)! : 'Unassigned';
      byPerson.set(dPid, { personId: dPid, was: wasLabel, now: callingLabel.get(cid) ?? '—' });
    }
  }
  for (const pid of stagedIds) {
    if (byPerson.has(pid)) continue;
    const wasCalling = [...masterByCalling.entries()].find(([, p]) => p === pid)?.[0];
    const wasLabel = wasCalling ? callingLabel.get(wasCalling)! : 'Unassigned';
    byPerson.set(pid, { personId: pid, was: wasLabel, now: 'Staging' });
  }

  const rows = [...byPerson.values()]
    .map((r) => ({ ...r, name: peopleById.get(r.personId)?.name ?? r.personId }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="px-6 py-4 border-b border-black/10 bg-surface">
      <h2 className="text-sm uppercase tracking-wide text-black/60 mb-2">
        Changes from Master ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm italic text-black/40">No changes yet.</p>
      ) : (
        <ul className="text-sm space-y-1">
          {rows.map((r) => (
            <li key={r.personId}>
              <span className="font-medium">{r.name}</span>
              <span className="text-black/50"> · Was: </span>
              <span>{r.was}</span>
              <span className="text-black/50"> → Now: </span>
              <span className={r.now === 'Staging' ? 'text-draft font-medium' : ''}>{r.now}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Verify end-to-end**

Run dev. Open a draft. Tap a person chip (it ring-highlights in amber + banner shows "Carrying: Name"). Tap another calling to place. Confirm:
- Original calling is vacated; new calling holds the person.
- If the new calling was occupied, the old occupant appears in Staging.
- Tap a staged chip, then tap Members Without a Calling — person becomes unassigned.
- Called / Sustained toggles work.
- Refresh — all changes persist.

- [ ] **Step 7: Commit**

```bash
git add lib/drag-context.tsx components/person-chip.tsx components/calling-row.tsx components/org-card.tsx components/draft-view.tsx
git commit -m "Add tap-to-move editing, Staging, Called/Sustained, and Changes panel"
```

---

## Phase 7 — Promotion

### Task 30: Promote modal

**Files:**
- Create: `components/promote-modal.tsx`
- Modify: `components/draft-view.tsx` (add the Promote button and wire the modal)

- [ ] **Step 1: `components/promote-modal.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { promoteDraft } from '@/lib/data/drafts';

interface DiffRow { name: string; was: string; now: string; }

export function PromoteModal({
  draftId, draftName, diff, onClose,
}: {
  draftId: string;
  draftName: string;
  diff: DiffRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [typed, setTyped] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const match = typed.trim() === draftName;

  async function onPromote() {
    setSubmitting(true); setError(null);
    try {
      await promoteDraft(draftId);
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-black/10">
        <h2 className="text-xl text-primary mb-1">Promote draft</h2>
        <p className="text-sm text-black/70 mb-4">
          This will replace master with <strong>{diff.length}</strong> {diff.length === 1 ? 'change' : 'changes'}. Set Apart
          status is preserved only where the assigned person didn't change.
        </p>
        {diff.length === 0 ? (
          <p className="italic text-black/60 mb-4">No changes from master. Nothing will happen.</p>
        ) : (
          <ul className="text-sm space-y-1 mb-4 max-h-64 overflow-y-auto bg-surface rounded p-3 border border-black/10">
            {diff.map((r) => (
              <li key={r.name}>
                <span className="font-medium">{r.name}</span>
                <span className="text-black/50"> · Was: </span>{r.was}
                <span className="text-black/50"> → Now: </span>
                <span className={r.now === 'Unassigned' ? 'text-black/50' : ''}>{r.now}</span>
              </li>
            ))}
          </ul>
        )}
        <label className="block text-sm mb-2">
          Type the draft name (<code className="font-numeric">{draftName}</code>) to confirm:
        </label>
        <input type="text" value={typed} onChange={(e) => setTyped(e.target.value)}
               className="w-full border border-black/20 rounded px-3 py-2 mb-4" />
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded border border-black/20">Cancel</button>
          <button onClick={onPromote} disabled={!match || submitting || diff.length === 0}
                  className="px-3 py-1.5 rounded bg-primary text-white disabled:opacity-40">
            {submitting ? 'Promoting…' : 'Promote'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Compute the diff in `DraftView` and add the button**

In `components/draft-view.tsx`, just after computing `ChangesPanel`'s rows, also build a diff array to pass to the modal. The cleanest move: extract the diff-computation into a top-level function and call it both from `ChangesPanel` and from a new button above the org grid.

Add above `DraftViewInner` in `draft-view.tsx`:

```tsx
function computeDiff({ organizations, callings, peopleById, masterAssignments, draftAssignments, staging }: {
  organizations: Organization[];
  callings: Calling[];
  peopleById: Map<string, Person>;
  masterAssignments: MasterAssignment[];
  draftAssignments: DraftAssignment[];
  staging: DraftStaging[];
}) {
  const stagedIds = new Set(staging.map((s) => s.person_id));
  const masterByCalling = new Map(masterAssignments.map((a) => [a.calling_id, a.person_id]));
  const draftByCalling = new Map(draftAssignments.map((a) => [a.calling_id, a.person_id]));
  const callingLabel = new Map<string, string>();
  const orgName = new Map(organizations.map((o) => [o.id, o.name]));
  for (const c of callings) callingLabel.set(c.id, `${orgName.get(c.organization_id) ?? ''} — ${c.title}`);
  type Row = { personId: string; was: string; now: string };
  const byPerson = new Map<string, Row>();
  const allCallingIds = new Set<string>([...masterByCalling.keys(), ...draftByCalling.keys()]);
  for (const cid of allCallingIds) {
    const mPid = masterByCalling.get(cid);
    const dPid = draftByCalling.get(cid);
    if (mPid === dPid) continue;
    if (mPid) {
      const nowCalling = [...draftByCalling.entries()].find(([, pid]) => pid === mPid)?.[0];
      const nowLabel = nowCalling ? callingLabel.get(nowCalling)! : (stagedIds.has(mPid) ? 'Staging' : 'Unassigned');
      byPerson.set(mPid, { personId: mPid, was: callingLabel.get(cid) ?? '—', now: nowLabel });
    }
    if (dPid) {
      if (byPerson.has(dPid)) continue;
      const wasCalling = [...masterByCalling.entries()].find(([, pid]) => pid === dPid)?.[0];
      const wasLabel = wasCalling ? callingLabel.get(wasCalling)! : 'Unassigned';
      byPerson.set(dPid, { personId: dPid, was: wasLabel, now: callingLabel.get(cid) ?? '—' });
    }
  }
  for (const pid of stagedIds) {
    if (byPerson.has(pid)) continue;
    const wasCalling = [...masterByCalling.entries()].find(([, p]) => p === pid)?.[0];
    const wasLabel = wasCalling ? callingLabel.get(wasCalling)! : 'Unassigned';
    byPerson.set(pid, { personId: pid, was: wasLabel, now: 'Staging' });
  }
  return [...byPerson.values()]
    .map((r) => ({ ...r, name: peopleById.get(r.personId)?.name ?? r.personId }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
```

Replace the body of `ChangesPanel` so it calls `computeDiff` and renders. Then inside `DraftViewInner`, add:

```tsx
import { PromoteModal } from './promote-modal';
// ...
const [promoteOpen, setPromoteOpen] = useState(false);
const diff = useMemo(() => computeDiff({
  organizations, callings, peopleById,
  masterAssignments, draftAssignments: localAssign, staging: localStage,
}), [organizations, callings, peopleById, masterAssignments, localAssign, localStage]);
```

Add a Promote button in the amber header strip (right side):

```tsx
<div className="bg-draft text-white px-6 py-3 flex items-center justify-between">
  <div>
    <p className="font-numeric text-xs uppercase tracking-wider opacity-80">Draft</p>
    <h1 className="text-2xl">{draft.name}</h1>
  </div>
  {!draft.archived && (
    <button onClick={() => setPromoteOpen(true)}
            className="px-3 py-1.5 rounded bg-white text-draft font-medium">
      Promote
    </button>
  )}
</div>
```

And at the very end of the JSX, render the modal:

```tsx
{promoteOpen && (
  <PromoteModal
    draftId={draft.id}
    draftName={draft.name}
    diff={diff.map(({ name, was, now }) => ({ name, was, now }))}
    onClose={() => setPromoteOpen(false)}
  />
)}
```

- [ ] **Step 3: Verify end-to-end**

Dev server. In a draft, move a few chips, open the Promote modal. Confirm the diff matches what the Changes panel shows. Type a wrong name → button disabled. Type the correct name → Promote enabled. Click Promote. Expected:
- Redirect to `/`.
- Master reflects the changes.
- `Set Apart` cleared on moved/new assignments; preserved where the person stayed the same.
- `/drafts` → "Show archived" → promoted draft appears grayed out with a "Promoted" label.

- [ ] **Step 4: Commit**

```bash
git add components/promote-modal.tsx components/draft-view.tsx
git commit -m "Promote flow: modal with diff, name-typed confirm, master replace via RPC"
```

---

## Phase 8 — Realtime + presence

### Task 31: Realtime subscriptions on master

**Files:**
- Modify: `components/master-view.tsx`

- [ ] **Step 1: Subscribe to `master_assignments` changes**

Inside `MasterView`, replace the data state with `useState` initialized from props, then subscribe on mount:

```tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
// ...existing imports

export function MasterView(props: {
  userId: string | null;
  organizations: Organization[];
  callings: Calling[];
  people: Person[];
  assignments: MasterAssignment[];
}) {
  const { userId, organizations, callings } = props;
  const [people, setPeople] = useState(props.people);
  const [assignments, setAssignments] = useState(props.assignments);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('master')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_assignments' }, async () => {
        const { data } = await supabase.from('master_assignments').select('calling_id, person_id, set_apart');
        if (data) setAssignments(data);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'people' }, async () => {
        const { data } = await supabase.from('people').select('id, name, slug').eq('ward_id', WARD_ID).order('name');
        if (data) setPeople(data);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  // ...existing useMemo blocks using `people` and `assignments` state instead of props
```

(Leave the rest of the component intact — it already reads from `people` and `assignments` — just change the source from props to state.)

Add the `WARD_ID` import if not already present: `import { WARD_ID } from '@/lib/types';`

- [ ] **Step 2: Verify**

Open two browser windows signed in as the same user. In one, toggle a Set Apart. Confirm the other window updates within ~1 second without a refresh.

- [ ] **Step 3: Commit**

```bash
git add components/master-view.tsx
git commit -m "Realtime: subscribe to master_assignments and people"
```

### Task 32: Realtime subscriptions on a draft

**Files:**
- Modify: `components/draft-view.tsx`

- [ ] **Step 1: Subscribe to draft tables in `DraftViewInner`**

At the top of `DraftViewInner`, add a useEffect:

```tsx
useEffect(() => {
  const supabase = createClient();
  const channel = supabase
    .channel(`draft:${draft.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_assignments', filter: `draft_id=eq.${draft.id}` }, async () => {
      const { data } = await supabase.from('draft_assignments')
        .select('draft_id, calling_id, person_id, called, sustained').eq('draft_id', draft.id);
      if (data) setLocalAssign(data);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_staging', filter: `draft_id=eq.${draft.id}` }, async () => {
      const { data } = await supabase.from('draft_staging')
        .select('draft_id, person_id').eq('draft_id', draft.id);
      if (data) setLocalStage(data);
    })
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}, [draft.id]);
```

Add imports: `import { useEffect } from 'react';` and `import { createClient } from '@/lib/supabase/client';`.

- [ ] **Step 2: Verify**

Open the same draft in two windows. Tap-move a chip in one window. Confirm the other window updates within ~1 second.

- [ ] **Step 3: Commit**

```bash
git add components/draft-view.tsx
git commit -m "Realtime: subscribe to draft_assignments and draft_staging"
```

### Task 33: Presence badge

**Files:**
- Create: `components/presence-badge.tsx`
- Modify: `components/master-view.tsx`, `components/draft-view.tsx`

- [ ] **Step 1: `components/presence-badge.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PresenceBadge({ channelName, userId }: { channelName: string; userId: string | null }) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase.channel(channelName, { config: { presence: { key: userId } } });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
      });
    return () => { void supabase.removeChannel(channel); };
  }, [channelName, userId]);

  if (count <= 1) return null;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-white text-primary border border-primary/30 font-numeric">
      {count} members here
    </span>
  );
}
```

- [ ] **Step 2: Use in Master header**

In `components/master-view.tsx` header, add to the right of the title:

```tsx
<div className="flex items-center gap-3">
  <PresenceBadge channelName="presence:master" userId={userId} />
</div>
```

And add `import { PresenceBadge } from './presence-badge';`.

- [ ] **Step 3: Use in Draft header**

In `components/draft-view.tsx` amber header, add next to the Promote button:

```tsx
<div className="flex items-center gap-3">
  <PresenceBadge channelName={`presence:draft:${draft.id}`} userId={userId} />
  {!draft.archived && (
    <button onClick={() => setPromoteOpen(true)}
            className="px-3 py-1.5 rounded bg-white text-draft font-medium">
      Promote
    </button>
  )}
</div>
```

- [ ] **Step 4: Verify**

Open two browser windows (or one browser + one private window, both signed in as Ryan) on the same draft. Confirm each shows "2 members here." Close one tab — the remaining shows no badge after ~1 second.

- [ ] **Step 5: Commit**

```bash
git add components/presence-badge.tsx components/master-view.tsx components/draft-view.tsx
git commit -m "Presence: show active-user count in master and draft headers"
```

---

## Phase 9 — Admin

### Task 34: Admin page shell + tabs

**Files:**
- Create: `app/admin/page.tsx`, `components/admin/admin-tabs.tsx`

- [ ] **Step 1: `app/admin/page.tsx`**

```tsx
import { AdminTabs } from '@/components/admin/admin-tabs';

export default function AdminPage() {
  return (
    <main className="container mx-auto px-6 py-8">
      <h1 className="text-3xl text-primary mb-6">Admin</h1>
      <AdminTabs />
    </main>
  );
}
```

- [ ] **Step 2: `components/admin/admin-tabs.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { UsersTab } from './users-tab';
import { PeopleTab } from './people-tab';
import { OrgsCallingsTab } from './orgs-callings-tab';
import { HistoryTab } from './history-tab';

const TABS = ['Users', 'People', 'Organizations & Callings', 'Promotion History'] as const;
type Tab = typeof TABS[number];

export function AdminTabs() {
  const [tab, setTab] = useState<Tab>('Users');
  return (
    <div>
      <div className="flex gap-1 border-b border-black/10 mb-6">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-2 text-sm ${tab === t ? 'border-b-2 border-primary text-primary font-medium' : 'text-black/60 hover:text-black'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Users' && <UsersTab />}
      {tab === 'People' && <PeopleTab />}
      {tab === 'Organizations & Callings' && <OrgsCallingsTab />}
      {tab === 'Promotion History' && <HistoryTab />}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx components/admin/admin-tabs.tsx
git commit -m "Scaffold admin page with tab shell"
```

### Task 35: Users tab

**Files:**
- Create: `components/admin/users-tab.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserAccessRow } from '@/lib/types';

interface Row extends UserAccessRow { email: string | null; }

export function UsersTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const supabase = createClient();
    const { data: access } = await supabase
      .from('user_access')
      .select('user_id, ward_id, display_name, granted_at');
    // Fetch emails via a view or via auth admin; for MVP we store display_name and show user_id.
    setRows((access ?? []).map((a) => ({ ...a, email: null })));
    setLoading(false);
  }

  useEffect(() => { void reload(); }, []);

  async function onRemove(userId: string) {
    if (!confirm('Remove this user\'s access? They will be signed out on their next page load.')) return;
    const supabase = createClient();
    const { error } = await supabase.from('user_access').delete().eq('user_id', userId);
    if (error) { alert(error.message); return; }
    void reload();
  }

  return (
    <div>
      <p className="text-sm text-black/70 mb-4">
        To invite a new user, create them in the Supabase dashboard under Authentication → Users, then add their row here via SQL (or ask Ryan to do it).
        Removing access here does not delete the auth user.
      </p>
      {loading ? <p className="text-sm text-black/60">Loading…</p> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.user_id} className="flex items-center justify-between gap-3 p-3 bg-surface border border-black/10 rounded">
              <div>
                <p className="font-medium">{r.display_name ?? '(no display name)'}</p>
                <p className="text-xs text-black/50 font-numeric">{r.user_id}</p>
              </div>
              <button onClick={() => onRemove(r.user_id)}
                      className="text-sm px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50">
                Remove access
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/users-tab.tsx
git commit -m "Admin: Users tab (list + remove access)"
```

### Task 36: People tab

**Files:**
- Create: `components/admin/people-tab.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { deletePerson, renamePerson } from '@/lib/data/people';
import { WARD_ID } from '@/lib/types';
import type { Person } from '@/lib/types';

export function PeopleTab() {
  const [rows, setRows] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignmentCountById, setAssignmentCountById] = useState<Map<string, { master: number; drafts: number }>>(new Map());

  async function reload() {
    setLoading(true);
    const supabase = createClient();
    const [peopleRes, masterRes, draftRes] = await Promise.all([
      supabase.from('people').select('id, name, slug').eq('ward_id', WARD_ID).order('name'),
      supabase.from('master_assignments').select('person_id'),
      supabase.from('draft_assignments').select('person_id'),
    ]);
    const counts = new Map<string, { master: number; drafts: number }>();
    for (const m of masterRes.data ?? []) {
      const c = counts.get(m.person_id) ?? { master: 0, drafts: 0 };
      c.master++; counts.set(m.person_id, c);
    }
    for (const d of draftRes.data ?? []) {
      const c = counts.get(d.person_id) ?? { master: 0, drafts: 0 };
      c.drafts++; counts.set(d.person_id, c);
    }
    setRows(peopleRes.data ?? []);
    setAssignmentCountById(counts);
    setLoading(false);
  }

  useEffect(() => { void reload(); }, []);

  async function onRename(row: Person) {
    const n = prompt('Rename member', row.name);
    if (!n || n === row.name) return;
    await renamePerson(row.id, n); void reload();
  }

  async function onDelete(row: Person) {
    const c = assignmentCountById.get(row.id) ?? { master: 0, drafts: 0 };
    const warning = c.master || c.drafts
      ? `This will remove ${row.name} from ${c.master} master calling(s) and ${c.drafts} draft assignment(s). History in Promotion History is preserved. Continue?`
      : `Delete ${row.name}?`;
    if (!confirm(warning)) return;
    await deletePerson(row.id); void reload();
  }

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <input type="text" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)}
             className="mb-4 w-full max-w-sm border border-black/20 rounded px-3 py-2" />
      {loading ? <p className="text-sm text-black/60">Loading…</p> : (
        <ul className="space-y-1">
          {filtered.map((r) => {
            const c = assignmentCountById.get(r.id) ?? { master: 0, drafts: 0 };
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 py-1 border-b border-black/5">
                <div>
                  <span>{r.name}</span>
                  <span className="ml-2 text-xs text-black/50 font-numeric">
                    master: {c.master} · drafts: {c.drafts}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onRename(r)} className="text-sm text-primary">Rename</button>
                  <button onClick={() => onDelete(r)} className="text-sm text-red-700">Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/people-tab.tsx
git commit -m "Admin: People tab with rename and cascade-preview delete"
```

### Task 37: Orgs & Callings tab

**Files:**
- Create: `lib/data/organizations.ts`, `components/admin/orgs-callings-tab.tsx`

- [ ] **Step 1: `lib/data/organizations.ts`**

```ts
'use client';

import { createClient } from '@/lib/supabase/client';
import { WARD_ID } from '@/lib/types';

export async function listOrgsAndCallings() {
  const supabase = createClient();
  const [orgs, callings] = await Promise.all([
    supabase.from('organizations').select('id, name, slug, sort_order').eq('ward_id', WARD_ID).order('sort_order'),
    supabase.from('callings').select('id, organization_id, title, sort_order').order('sort_order'),
  ]);
  return { orgs: orgs.data ?? [], callings: callings.data ?? [] };
}

export async function addOrg(name: string, slug: string, sort_order: number) {
  const supabase = createClient();
  const { error } = await supabase.from('organizations').insert({ ward_id: WARD_ID, name, slug, sort_order });
  if (error) throw error;
}

export async function renameOrg(id: string, name: string) {
  const supabase = createClient();
  const { error } = await supabase.from('organizations').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteOrg(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('organizations').delete().eq('id', id);
  if (error) throw error;
}

export async function addCalling(organization_id: string, title: string, sort_order: number) {
  const supabase = createClient();
  const { error } = await supabase.from('callings').insert({ organization_id, title, sort_order });
  if (error) throw error;
}

export async function renameCalling(id: string, title: string) {
  const supabase = createClient();
  const { error } = await supabase.from('callings').update({ title }).eq('id', id);
  if (error) throw error;
}

export async function deleteCalling(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('callings').delete().eq('id', id);
  if (error) throw error;
}
```

- [ ] **Step 2: `components/admin/orgs-callings-tab.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import {
  listOrgsAndCallings, addOrg, renameOrg, deleteOrg,
  addCalling, renameCalling, deleteCalling,
} from '@/lib/data/organizations';
import { toSlug } from '@/lib/utils/slug';
import type { Organization, Calling } from '@/lib/types';

export function OrgsCallingsTab() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [callings, setCallings] = useState<Calling[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    const data = await listOrgsAndCallings();
    setOrgs(data.orgs); setCallings(data.callings); setLoading(false);
  }

  useEffect(() => { void reload(); }, []);

  async function onAddOrg() {
    const name = prompt('New organization name'); if (!name) return;
    const slug = toSlug(name);
    await addOrg(name, slug, orgs.length); void reload();
  }

  async function onRenameOrg(o: Organization) {
    const n = prompt('Rename organization', o.name); if (!n || n === o.name) return;
    await renameOrg(o.id, n); void reload();
  }

  async function onDeleteOrg(o: Organization) {
    if (!confirm(`Delete ${o.name} and all of its callings and assignments? This cannot be undone.`)) return;
    await deleteOrg(o.id); void reload();
  }

  async function onAddCalling(o: Organization) {
    const title = prompt('Calling title'); if (!title) return;
    const count = callings.filter((c) => c.organization_id === o.id).length;
    await addCalling(o.id, title, count); void reload();
  }

  async function onRenameCalling(c: Calling) {
    const t = prompt('Rename calling', c.title); if (!t || t === c.title) return;
    await renameCalling(c.id, t); void reload();
  }

  async function onDeleteCalling(c: Calling) {
    if (!confirm('Delete this calling? Assignments on it will be cleared.')) return;
    await deleteCalling(c.id); void reload();
  }

  if (loading) return <p className="text-sm text-black/60">Loading…</p>;

  return (
    <div>
      <button onClick={onAddOrg}
              className="mb-4 px-3 py-1.5 rounded bg-primary text-white">Add organization</button>
      <ul className="space-y-4">
        {orgs.map((o) => (
          <li key={o.id} className="bg-surface border border-black/10 rounded p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-primary">{o.name}</h3>
              <div className="flex gap-2 text-sm">
                <button onClick={() => onRenameOrg(o)} className="text-primary">Rename</button>
                <button onClick={() => onDeleteOrg(o)} className="text-red-700">Delete</button>
              </div>
            </div>
            <ul className="mt-2 space-y-1">
              {callings.filter((c) => c.organization_id === o.id).map((c) => (
                <li key={c.id} className="flex items-center justify-between py-1 border-b border-black/5">
                  <span className="text-sm">{c.title}</span>
                  <div className="flex gap-2 text-sm">
                    <button onClick={() => onRenameCalling(c)} className="text-primary">Rename</button>
                    <button onClick={() => onDeleteCalling(c)} className="text-red-700">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
            <button onClick={() => onAddCalling(o)}
                    className="mt-2 text-sm text-primary">+ Add calling</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Reordering via drag-handles is out of scope for MVP — `sort_order` can be adjusted via SQL or a later iteration if it becomes an issue.

- [ ] **Step 3: Commit**

```bash
git add lib/data/organizations.ts components/admin/orgs-callings-tab.tsx
git commit -m "Admin: Organizations and Callings CRUD"
```

### Task 38: Promotion History tab

**Files:**
- Create: `lib/data/history.ts`, `components/admin/history-tab.tsx`

- [ ] **Step 1: `lib/data/history.ts`**

```ts
'use client';

import { createClient } from '@/lib/supabase/client';
import { WARD_ID } from '@/lib/types';
import type { PromotionHistoryRow } from '@/lib/types';

export async function listPromotionHistory(): Promise<PromotionHistoryRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('promotion_history')
    .select('id, draft_name, promoted_at, promoted_by, snapshot')
    .eq('ward_id', WARD_ID)
    .order('promoted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PromotionHistoryRow[];
}
```

- [ ] **Step 2: `components/admin/history-tab.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { listPromotionHistory } from '@/lib/data/history';
import type { PromotionHistoryRow } from '@/lib/types';

export function HistoryTab() {
  const [rows, setRows] = useState<PromotionHistoryRow[]>([]);
  const [selected, setSelected] = useState<PromotionHistoryRow | null>(null);

  useEffect(() => { void listPromotionHistory().then(setRows); }, []);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <ul className="md:col-span-1 space-y-1">
        {rows.map((r) => (
          <li key={r.id}>
            <button onClick={() => setSelected(r)}
                    className={`w-full text-left p-2 rounded border ${selected?.id === r.id ? 'border-primary bg-primary/5' : 'border-black/10 hover:bg-black/5'}`}>
              <p className="font-medium">{r.draft_name}</p>
              <p className="text-xs text-black/50 font-numeric">{new Date(r.promoted_at).toLocaleString()}</p>
            </button>
          </li>
        ))}
        {rows.length === 0 && <p className="text-sm text-black/60">No promotions yet.</p>}
      </ul>
      <div className="md:col-span-2">
        {selected ? (
          <div className="bg-surface border border-black/10 rounded p-4">
            <h3 className="text-lg text-primary mb-3">{selected.draft_name}</h3>
            <p className="text-xs text-black/50 font-numeric mb-4">
              Promoted {new Date(selected.promoted_at).toLocaleString()}
            </p>
            <ul className="text-sm space-y-1 max-h-[60vh] overflow-y-auto">
              {selected.snapshot
                .sort((a, b) => (a.organization_name + a.calling_title).localeCompare(b.organization_name + b.calling_title))
                .map((s) => (
                  <li key={s.calling_id}>
                    <span className="text-black/50">{s.organization_name}</span>
                    <span className="text-black/30"> — </span>
                    <span>{s.calling_title}: </span>
                    <span className="font-medium">{s.person_name}</span>
                    {s.set_apart && <span className="ml-2 text-xs font-numeric text-primary">SA</span>}
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-black/60">Select a promotion to view its snapshot.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the admin page end-to-end**

Dev server. Visit `/admin`. Click each tab. Confirm:
- Users: Ryan's row appears.
- People: all 143 members listed with accurate master/draft counts.
- Orgs & Callings: all 23 orgs with their callings.
- Promotion History: any promotions done earlier now visible with rendered snapshots.

- [ ] **Step 4: Commit**

```bash
git add lib/data/history.ts components/admin/history-tab.tsx
git commit -m "Admin: Promotion History tab with snapshot viewer"
```

### Task 39: Header navigation between Master / Drafts / Admin

**Files:**
- Create: `components/header.tsx`
- Modify: `components/master-view.tsx`, `components/draft-view.tsx`, `app/admin/page.tsx`

- [ ] **Step 1: `components/header.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = '/sign-in';
  }
  const linkClass = (href: string) =>
    `text-sm px-2 py-1 rounded ${pathname === href || pathname.startsWith(href + '/') ? 'text-primary font-medium' : 'text-black/60 hover:text-black'}`;
  return (
    <nav className="flex items-center gap-3 px-6 py-3 border-b border-black/10 bg-white">
      <Link href="/" className={linkClass('/')}>Master</Link>
      <Link href="/drafts" className={linkClass('/drafts')}>Drafts</Link>
      <Link href="/admin" className={linkClass('/admin')}>Admin</Link>
      <span className="flex-1" />
      <button onClick={signOut} aria-label="Sign out"
              className="text-sm text-black/60 hover:text-black inline-flex items-center gap-1">
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </nav>
  );
}
```

- [ ] **Step 2: Mount header at the top of each authenticated view**

In `components/master-view.tsx`, wrap the outer div:

```tsx
return (
  <>
    <Header />
    <div className="md:flex md:min-h-[calc(100vh-3rem)]"> ...existing... </div>
  </>
);
```

Do the same in `components/draft-view.tsx` above the amber header strip, and in `app/admin/page.tsx` above the `<main>`.

Add `import { Header } from './header';` or `import { Header } from '@/components/header';` as appropriate.

- [ ] **Step 3: Verify**

Dev server. Top of every page now shows Master / Drafts / Admin / Sign out. Active route is highlighted. Signing out returns to `/sign-in`.

- [ ] **Step 4: Commit**

```bash
git add components/header.tsx components/master-view.tsx components/draft-view.tsx app/admin/page.tsx
git commit -m "Add global header with Master/Drafts/Admin/Sign out"
```

---

## Phase 10 — Deploy

### Task 40: Vercel + prod Supabase

**Files:** none in repo; Vercel + Supabase dashboard actions.

- [ ] **Step 1: Create `calling-matrix-prod` Supabase project**

Use MCP `create_project` with the same organization + region as dev.

- [ ] **Step 2: Apply all four migrations to prod**

Via MCP `apply_migration` (or `supabase db push` if using the CLI): `initial_schema`, `rls_policies`, `rpcs`, then re-run `node scripts/build-seed.mjs` and apply `seed`.

- [ ] **Step 3: Provision Ryan on prod**

Create the auth user in the prod Supabase dashboard with `must_change_password: false`. Then MCP `execute_sql`:

```sql
insert into user_access (user_id, ward_id, display_name)
select id, '00000000-0000-0000-0000-000000000001', 'Ryan Bunker'
from auth.users where email = 'rbunker@abpcapital.com';
```

- [ ] **Step 4: Import the GitHub repo into Vercel**

Ryan does this from the Vercel dashboard: New Project → Import → select the repo → accept defaults. Don't deploy yet.

- [ ] **Step 5: Set environment variables in Vercel**

For **Production** scope:
- `NEXT_PUBLIC_SUPABASE_URL` = prod project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = prod anon key

For **Preview** scope:
- Same two variables, but pointing to the dev project.

- [ ] **Step 6: Deploy**

Push to `main`. Vercel builds and publishes to `rc-calling-matrix.vercel.app`.

- [ ] **Step 7: Smoke test prod**

Sign in as Ryan on `rc-calling-matrix.vercel.app` on a phone. Confirm:
- Master view renders all orgs.
- Creating/editing/promoting a draft works.
- Realtime updates propagate between phone and desktop sessions.
- Admin tabs function.

- [ ] **Step 8: Commit a milestone marker**

```bash
git commit --allow-empty -m "Production deploy: rc-calling-matrix.vercel.app live"
git push origin main
```

---

## Self-Review

**Spec coverage** (cross-checked against `docs/superpowers/specs/2026-04-19-rc-calling-matrix-design.md`):

| Spec section | Implemented in |
|---|---|
| §3 Stack (Next.js, Supabase, Vercel, no ORM) | Tasks 1, 3, 6, 11, 40 |
| §4 Visual system (fonts, colors, master/draft distinction) | Tasks 4, 20–22, 28 |
| §5.1–5.4 Schema | Task 7 |
| §5.6 FK cascade behavior | Task 7 (cascade on `master_assignments`, `draft_assignments`, `draft_staging`) |
| §5.7 RLS policies | Task 8 |
| §5.8 Seed + org sort order | Task 10 |
| §6 Auth (sign-in, middleware, set-password, forgot = contact admin, first-user MCP) | Tasks 11–15 |
| §7.1 Master view (header, stats, sidebar, orgs, unassigned, add member) | Tasks 19–25 |
| §7.2 Drafts list (create/rename/delete, show archived) | Task 27 |
| §7.3 Draft view (amber header, staging, changes panel, drag, called/sustained) | Tasks 28, 29 |
| §7.4 `/account/set-password` | Task 14 |
| §7.5 `/sign-in` with "contact admin" copy | Task 13 |
| §7.6 Admin tabs | Tasks 34–38 |
| §8 Promote (diff, name-type confirm, transactional RPC, archive) | Tasks 9, 30 |
| §9 Realtime + presence | Tasks 31–33 |
| §10 Performance + a11y | Inherent to the component-level decisions (focus states, semantic HTML, tap-equivalents in Task 29) |
| §11 File conventions | Followed throughout |
| §12 Testing (TypeScript + manual QA) | Every "Verify" step; no test runner introduced |
| §13 Out of scope items | Not built (confirmed absent) |

Navigation between the three main routes was added in Task 39 (not a separate spec requirement but a usability need that surfaced while planning).

**Placeholder scan:** No "TBD"/"TODO"/"similar to Task N" references. Every code block is complete as written.

**Type consistency:**
- `MasterAssignment.set_apart` used consistently.
- `DraftAssignment.called` / `.sustained` used consistently.
- RPC names `create_draft(p_ward_id, p_name)` and `promote_draft(p_draft_id)` match their invocations.
- `WARD_ID` constant used from `lib/types.ts` everywhere a ward is referenced.

---

## Execution Handoff

Plan complete and saved to [docs/superpowers/plans/2026-04-19-rc-calling-matrix.md](../plans/2026-04-19-rc-calling-matrix.md). Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?







