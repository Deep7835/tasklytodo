import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/ui';

interface ToastItem {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
  tone?: 'default' | 'error';
}

type Show = (message: string, opts?: { action?: ToastItem['action']; tone?: ToastItem['tone']; duration?: number }) => void;

const ToastContext = createContext<Show>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback<Show>(
    (message, opts = {}) => {
      const id = ++seq.current;
      // Keep at most 3 on screen; newest wins.
      setToasts((t) => [...t.slice(-2), { id, message, action: opts.action, tone: opts.tone }]);
      setTimeout(() => dismiss(id), opts.duration ?? (opts.action ? 5000 : 2800));
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+9rem)] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex max-w-sm animate-toast-in items-center gap-3 rounded-xl py-2.5 pr-2.5 pl-4 text-[13.5px] font-medium shadow-float',
              'bg-[#1c1d22] text-white dark:bg-[#2a2b31]',
              t.tone === 'error' && 'bg-[#b42335] dark:bg-[#b42335]',
            )}
          >
            <span className="min-w-0 flex-1">{t.message}</span>
            {t.action ? (
              <button
                type="button"
                className="rounded-lg px-2.5 py-1 text-[13px] font-semibold text-white/90 transition-colors hover:bg-white/10"
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            ) : (
              <span className="w-1.5" />
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
