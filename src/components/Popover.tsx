import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'reicon-react';
import { cn } from '../lib/ui';

interface Props {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

/** A tiny anchored popover, portalled so sheets/scroll areas never clip it. Flips upward when needed. */
export function Popover({ trigger, children, align = 'start', className }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({ visibility: 'hidden' });
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!ref.current || !panelRef.current) return;
      const a = ref.current.getBoundingClientRect();
      const { offsetWidth: w, offsetHeight: h } = panelRef.current;
      const gap = 6;
      const up = a.bottom + h + gap + 8 > window.innerHeight && a.top > h + gap + 8;
      let left = align === 'end' ? a.right - w : a.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      setPos({ left, top: up ? a.top - h - gap : a.bottom + gap });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) {
      setPos({ visibility: 'hidden' });
      return;
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            data-popover
            style={{ position: 'fixed', ...pos }}
            className={cn('z-[70] min-w-[190px] animate-scale-in rounded-xl border border-line bg-elevated p-1 shadow-float', className)}
          >
            {children(() => setOpen(false))}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function MenuItem({
  icon,
  label,
  hint,
  selected,
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  hint?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-fg transition-colors hover:bg-hover"
    >
      {icon && <span className="grid size-4 shrink-0 place-items-center text-muted">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="text-[12px] text-faint">{hint}</span>}
      {selected && <Check className="size-3.5 text-accent" />}
    </button>
  );
}
