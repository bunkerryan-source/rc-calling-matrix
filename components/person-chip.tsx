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
