import type { ReactNode } from 'react';

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex animate-rise-in flex-col items-center px-6 py-16 text-center md:py-20">
      <div className="relative mb-5 grid size-16 place-items-center rounded-[20px] border border-line bg-surface text-accent shadow-soft">
        <div className="absolute inset-0 rounded-[20px] bg-accent-soft opacity-60" aria-hidden />
        <span className="relative">{icon}</span>
      </div>
      <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="mt-1.5 max-w-[19rem] text-[13.5px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
