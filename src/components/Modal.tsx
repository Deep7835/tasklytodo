import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useIsDesktop } from '../lib/hooks';
import { cn } from '../lib/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Hide the visible title bar (title is still used for a11y). */
  hideHeader?: boolean;
  /** `drawer` slides in from the right on desktop; both become bottom sheets on mobile. */
  variant?: 'dialog' | 'drawer';
  size?: 'sm' | 'md';
  children: ReactNode;
  footer?: ReactNode;
  /** Element to focus on open; defaults to the panel itself. */
  initialFocus?: React.RefObject<HTMLElement | null>;
}

const stack: string[] = [];
const EXIT_MS = 170;

export function Modal({ open, onClose, title, hideHeader, variant = 'dialog', size = 'md', children, footer, initialFocus }: Props) {
  const id = useId();
  const isDesktop = useIsDesktop();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
      const t = setTimeout(() => setMounted(false), EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    stack.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => (initialFocus?.current ?? panelRef.current)?.focus({ preventScroll: true }));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === 'Tab' && panelRef.current) {
        // Minimal focus trap.
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(id), 1);
      if (!stack.length) document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, id, initialFocus]);

  if (!mounted) return null;

  const sheet = !isDesktop;
  const drawer = isDesktop && variant === 'drawer';

  return createPortal(
    <div className="fixed inset-0 z-50" role="presentation">
      <div
        className={cn(
          'absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity dark:bg-black/50',
          closing ? 'opacity-0 duration-150' : 'animate-fade-in',
        )}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex',
          sheet ? 'items-end' : drawer ? 'justify-end' : 'items-start justify-center px-4 pt-[10vh]',
        )}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          tabIndex={-1}
          className={cn(
            'pointer-events-auto flex flex-col bg-elevated text-fg outline-none shadow-float transition-[opacity,transform] ease-out',
            sheet && 'max-h-[92dvh] w-full rounded-t-[22px] border-t border-line pb-safe',
            drawer && 'm-2 h-[calc(100%-1rem)] w-[440px] max-w-[calc(100vw-1rem)] rounded-2xl border border-line',
            !sheet && !drawer && cn('max-h-[80vh] w-full rounded-2xl border border-line', size === 'sm' ? 'max-w-sm' : 'max-w-lg'),
            closing
              ? cn('duration-150', sheet ? 'translate-y-full' : drawer ? 'translate-x-6 opacity-0' : 'scale-[0.98] opacity-0')
              : sheet
                ? 'animate-sheet-in'
                : drawer
                  ? 'animate-drawer-in'
                  : 'animate-scale-in',
          )}
        >
          {sheet && (
            <div className="flex justify-center pt-2.5 pb-1" aria-hidden>
              <div className="h-1 w-9 rounded-full bg-line-strong" />
            </div>
          )}
          <div className={cn('flex items-center justify-between gap-3 px-5', hideHeader ? 'sr-only' : sheet ? 'pt-1.5 pb-2' : 'pt-4 pb-2')}>
            <h2 id={`${id}-title`} className="text-[15px] font-semibold tracking-[-0.01em]">
              {title}
            </h2>
            {!hideHeader && (
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-fg"
                aria-label="Close"
              >
                <X className="size-[18px]" />
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
