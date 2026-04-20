import { loadMaster } from '@/lib/data/master';
import { OrgCard } from '@/components/org-card';
import { UnassignedSection } from '@/components/unassigned-section';

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

      <UnassignedSection people={unassignedPeople} />
    </main>
  );
}
