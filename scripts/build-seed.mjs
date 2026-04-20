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

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, lines.join('\n') + '\n');
console.log(`Wrote ${lines.length} lines to ${OUT_PATH}`);
