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
