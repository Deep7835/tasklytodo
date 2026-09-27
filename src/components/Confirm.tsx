import { useRef } from 'react';
import { Modal } from './Modal';
import { cn } from '../lib/ui';

export interface ConfirmOptions {
  title: string;
  message: string;
  actions: { label: string; tone?: 'danger' | 'primary' | 'default'; onClick: () => void }[];
}

export function ConfirmDialog({ options, onClose }: { options: ConfirmOptions | null; onClose: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Modal open={!!options} onClose={onClose} title={options?.title ?? ''} size="sm" initialFocus={cancelRef}>
      {options && (
        <div className="px-5 pb-5">
          <p className="text-[14px] leading-relaxed text-muted">{options.message}</p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button ref={cancelRef} type="button" onClick={onClose} className={btn('default')}>
              Cancel
            </button>
            {options.actions.map((a) => (
              <button
                key={a.label}
                type="button"
                className={btn(a.tone ?? 'primary')}
                onClick={() => {
                  a.onClick();
                  onClose();
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

export const btn = (tone: 'danger' | 'primary' | 'default') =>
  cn(
    'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold transition-[background-color,transform] active:scale-[0.98] sm:h-9',
    tone === 'primary' && 'bg-accent text-accent-fg hover:brightness-110',
    tone === 'danger' && 'bg-[#e5484d] text-white hover:bg-[#d93d42]',
    tone === 'default' && 'border border-line bg-surface text-fg hover:bg-hover',
  );
