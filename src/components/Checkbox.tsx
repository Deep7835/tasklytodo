import { PRIORITY_COLOR, cn } from '../lib/ui';
import type { Priority } from '../store/types';

interface Props {
  checked: boolean;
  priority?: Priority;
  onChange: () => void;
  label: string;
  size?: 'md' | 'lg';
}

export function Checkbox({ checked, priority = 0, onChange, label, size = 'md' }: Props) {
  const tint = PRIORITY_COLOR[priority];
  const dim = size === 'lg' ? 'size-[22px]' : 'size-[19px]';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="group/check relative -m-2 grid shrink-0 place-items-center p-2"
    >
      <span
        key={String(checked)}
        className={cn(
          dim,
          'grid place-items-center rounded-full border-[1.5px] transition-colors duration-150',
          checked ? 'animate-check-pop border-transparent bg-accent' : 'border-line-strong group-hover/check:border-faint',
        )}
        style={
          checked
            ? tint
              ? { backgroundColor: tint }
              : undefined
            : tint
              ? { borderColor: tint, backgroundColor: `color-mix(in oklab, ${tint} 9%, transparent)` }
              : undefined
        }
      >
        {checked ? (
          <svg viewBox="0 0 16 16" className="size-[11px] text-accent-fg" style={tint ? { color: '#fff' } : undefined} aria-hidden>
            <path className="check-path" d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" className="size-[11px] opacity-0 transition-opacity group-hover/check:opacity-40" aria-hidden>
            <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
