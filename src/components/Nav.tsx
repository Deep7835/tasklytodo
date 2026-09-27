import { useId, useState, type ReactNode } from 'react';
import { Hash, Inbox, Layers, ListTodo, Plus, Settings2, Sun } from 'lucide-react';
import { Modal } from './Modal';
import { CategoryDot } from './pickers';
import { cn, nextListColor } from '../lib/ui';
import { useStore } from '../store/store';
import type { Filter, Scope } from '../store/types';

export interface NavState {
  scope: Scope;
  filter: Filter;
  go: (scope: Scope, filter?: Filter) => void;
  counts: { all: number; today: number; byCategory: Map<string, number> };
}

export function Logo({ className = 'size-7' }: { className?: string }) {
  // Unique per instance: a shared id would resolve to the copy inside the hidden sidebar and render nothing.
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6B6CF6" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id})`} />
      <path d="M19 33.5l8.5 8.5L45 23" fill="none" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavItem({
  icon,
  label,
  count,
  active,
  onClick,
  large,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors',
        large ? 'h-12 text-[15px]' : 'h-8 text-[13.5px]',
        active ? 'bg-fg/[0.07] font-medium text-fg' : 'text-muted hover:bg-hover hover:text-fg',
      )}
    >
      <span className={cn('grid size-4 shrink-0 place-items-center', active ? 'text-fg' : 'text-faint group-hover:text-muted')}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {!!count && <span className="text-[12px] text-faint tabular-nums">{count}</span>}
    </button>
  );
}

function NewListInput({ onCreated, large }: { onCreated?: (id: string) => void; large?: boolean }) {
  const { data, addCategory } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  const submit = () => {
    const n = name.trim();
    if (n) {
      const c = addCategory(n, nextListColor(data.categories));
      onCreated?.(c.id);
    }
    setName('');
    setEditing(false);
  };

  if (!editing)
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-2.5 text-faint transition-colors hover:bg-hover hover:text-muted',
          large ? 'h-12 text-[15px]' : 'h-8 text-[13.5px]',
        )}
      >
        <Plus className="size-4" />
        New list
      </button>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn('flex items-center gap-2.5 rounded-lg bg-hover px-2.5', large ? 'h-12' : 'h-8')}
    >
      <Hash className="size-4 text-faint" />
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setName('');
            setEditing(false);
          }
        }}
        maxLength={32}
        placeholder="List name"
        aria-label="New list name"
        className={cn('min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint', large ? 'text-[15px]' : 'text-[13.5px]')}
      />
    </form>
  );
}

function NavLists({ nav, large, after }: { nav: NavState; large?: boolean; after?: () => void }) {
  const { data } = useStore();
  const go = (scope: Scope, filter?: Filter) => {
    nav.go(scope, filter);
    after?.();
  };
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <NavItem
          large={large}
          icon={<Inbox className="size-4" />}
          label="All tasks"
          count={nav.counts.all}
          active={nav.scope === null && nav.filter !== 'today'}
          onClick={() => go(null, nav.filter === 'today' ? 'all' : undefined)}
        />
        <NavItem
          large={large}
          icon={<Sun className="size-4" />}
          label="Today"
          count={nav.counts.today}
          active={nav.scope === null && nav.filter === 'today'}
          onClick={() => go(null, 'today')}
        />
      </div>
      <div className="mt-6 mb-1.5 px-2.5 text-[11.5px] font-semibold tracking-[0.06em] text-faint uppercase">Lists</div>
      <div className="flex flex-col gap-0.5">
        {data.categories.map((c) => (
          <NavItem
            key={c.id}
            large={large}
            icon={<CategoryDot category={c} className="size-2.5" />}
            label={c.name}
            count={nav.counts.byCategory.get(c.id)}
            active={nav.scope === c.id}
            onClick={() => go(c.id, nav.filter === 'today' ? 'all' : undefined)}
          />
        ))}
        <NewListInput large={large} onCreated={(id) => go(id, 'all')} />
      </div>
    </>
  );
}

export function Sidebar({ nav, onSettings, search }: { nav: NavState; onSettings: () => void; search: ReactNode }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Logo />
        <span className="text-[16px] font-semibold tracking-[-0.02em]">Taskly</span>
      </div>
      <div className="flex px-3 pb-3">{search}</div>
      <nav className="flex-1 overflow-y-auto px-3 pt-1" aria-label="Lists">
        <NavLists nav={nav} />
      </nav>
      <div className="border-t border-line p-3">
        <NavItem icon={<Settings2 className="size-4" />} label="Settings" active={false} onClick={onSettings} />
      </div>
    </aside>
  );
}

export function ListsSheet({ open, onClose, nav, onManage }: { open: boolean; onClose: () => void; nav: NavState; onManage: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Lists">
      <nav className="px-3 pb-4" aria-label="Lists">
        <NavLists nav={nav} large after={onClose} />
        <button
          type="button"
          onClick={() => {
            onClose();
            onManage();
          }}
          className="mt-3 w-full rounded-lg px-2.5 py-2 text-left text-[13.5px] font-medium text-accent"
        >
          Manage lists…
        </button>
      </nav>
    </Modal>
  );
}

export function MobileTabBar({
  nav,
  onLists,
  onSettings,
  listsOpen,
}: {
  nav: NavState;
  onLists: () => void;
  onSettings: () => void;
  listsOpen: boolean;
}) {
  const tab = (label: string, icon: ReactNode, active: boolean, onClick: () => void, badge?: number) => (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 text-[10.5px] font-medium transition-colors',
        active ? 'text-accent' : 'text-muted active:text-fg',
      )}
    >
      <span className="relative">
        {icon}
        {!!badge && (
          <span className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 font-semibold text-accent-fg">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      {label}
    </button>
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/85 pb-safe backdrop-blur-xl backdrop-saturate-150 md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md">
        {tab('Tasks', <ListTodo className="size-[22px]" />, !listsOpen && nav.scope === null && nav.filter !== 'today', () =>
          nav.go(null, nav.filter === 'today' ? 'all' : undefined),
        )}
        {tab('Today', <Sun className="size-[22px]" />, !listsOpen && nav.scope === null && nav.filter === 'today', () => nav.go(null, 'today'), nav.counts.today)}
        {tab('Lists', <Layers className="size-[22px]" />, listsOpen || nav.scope !== null, onLists)}
        {tab('Settings', <Settings2 className="size-[22px]" />, false, onSettings)}
      </div>
    </nav>
  );
}
