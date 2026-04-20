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
