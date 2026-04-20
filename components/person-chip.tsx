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
