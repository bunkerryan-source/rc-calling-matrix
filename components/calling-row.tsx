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
