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
