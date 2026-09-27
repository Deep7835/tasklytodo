import { useEffect, useId, useState, type ReactNode } from 'react';
import { BookOpen, Category, ChevronDown, Hashtag, Inbox, Layers, ListCheck, Plus, Settings2, Sparkles, Sun, Trash2 } from 'reicon-react';
import { Avatar } from './Avatar';
import { Modal } from './Modal';
import { MenuItem, Popover } from './Popover';
import { CATEGORY_COLORS, cn, nextListColor } from '../lib/ui';
import { useStore } from '../store/store';
import type { Filter, Scope } from '../store/types';

export interface NavState {
  scope: Scope;
  filter: Filter;
  /** Which main view is showing: the task list or the templates library. */
  view: 'tasks' | 'templates';
  go: (scope: Scope, filter?: Filter) => void;
  openTemplates: () => void;
  /** Asks to confirm, then deletes the list. */
  deleteList: (id: string) => void;
  counts: { all: number; today: number; byCategory: Map<string, number> };
}

export function Logo({ className = 'size-7' }: { className?: string }) {
  // Unique per instance: a shared id would resolve to the copy inside the hidden sidebar and render nothing.
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        {/* Follows the accent chosen in Settings: accent → a deeper shade of it. */}
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'color-mix(in oklab, var(--accent), white 10%)' }} />
          <stop offset="1" style={{ stopColor: 'color-mix(in oklab, var(--accent), black 28%)' }} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id})`} />
      <path d="M19 33.5l8.5 8.5L45 23" fill="none" stroke="var(--accent-fg)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Small colored dot marking a list, with a soft halo in the same color. */
function ListDot({ color }: { color: string }) {
  return (
    <span
      className="size-2.5 rounded-full"
      style={{ backgroundColor: color, boxShadow: `0 0 0 3px color-mix(in oklab, ${color} 18%, transparent)` }}
      aria-hidden
    />
  );
}

function NavItem({
  icon,
  label,
  count,
  active,
  onClick,
  onDelete,
  large,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  /** Adds a delete button: revealed on hover/focus with a pointer, always shown in the touch sheet. */
  onDelete?: () => void;
  large?: boolean;
}) {
  return (
    <div className="group/item relative">
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex w-full items-center gap-3 rounded-lg px-2.5 text-left transition-[background-color,color] duration-150 ease-out',
          large ? 'h-12 text-[15px]' : 'h-9 text-[13.5px]',
          onDelete && large && 'pr-12',
          active ? 'bg-fg/[0.06] font-medium text-fg' : 'text-fg/70 hover:bg-hover hover:text-fg',
        )}
      >
        {/* Accent bar marking the current view. */}
        {active && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-accent" aria-hidden />}
        <span className={cn('grid size-5 shrink-0 place-items-center', active ? 'text-accent' : 'text-muted')}>{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {!!count && (
          <span
            className={cn(
              'text-[12px] tabular-nums transition-opacity duration-150',
              active ? 'text-muted' : 'text-faint',
              onDelete && !large && 'group-focus-within/item:opacity-0 group-hover/item:opacity-0',
            )}
          >
            {count}
          </span>
        )}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${label}`}
          title="Delete list"
          className={cn(
            'absolute top-1/2 right-1.5 grid -translate-y-1/2 place-items-center rounded-md text-faint transition-[opacity,color,background-color] duration-150 hover:bg-[#e5484d]/10 hover:text-[#e5484d] focus-visible:opacity-100',
            large ? 'size-9' : 'size-7 opacity-0 group-hover/item:opacity-100',
          )}
        >
          <Trash2 className={large ? 'size-[18px]' : 'size-4'} />
        </button>
      )}
    </div>
  );
}

const NEW_LIST_EVENT = 'taskly:new-list';

/** Opens the "New list" field from elsewhere (e.g. the Create menu). `sheet` targets the mobile Lists sheet. */
export const startNewList = (sheet = false) => window.dispatchEvent(new CustomEvent(NEW_LIST_EVENT, { detail: { sheet } }));

/** Inline name field for a new list; hidden until started from the Lists "+" button or the Create menu. */
function NewListInput({ onCreated, large }: { onCreated?: (id: string) => void; large?: boolean }) {
  const { data, addCategory } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    const onStart = (e: Event) => {
      if (!!(e as CustomEvent<{ sheet: boolean }>).detail?.sheet === !!large) setEditing(true);
    };
    window.addEventListener(NEW_LIST_EVENT, onStart);
    return () => window.removeEventListener(NEW_LIST_EVENT, onStart);
  }, [large]);

  const submit = () => {
    const n = name.trim();
    if (n) {
      const c = addCategory(n, nextListColor(data.categories));
      onCreated?.(c.id);
    }
    setName('');
    setEditing(false);
  };

  if (!editing) return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn('flex items-center gap-3 rounded-lg bg-hover px-2.5', large ? 'h-12' : 'h-9')}
    >
      <span className="grid size-5 shrink-0 place-items-center">
        <ListDot color={CATEGORY_COLORS[nextListColor(data.categories)]} />
      </span>
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
  const tasksView = nav.view === 'tasks';
  const icon = large ? 'size-5' : 'size-[18px]';
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <NavItem
          large={large}
          icon={<Inbox className={icon} />}
          label="All tasks"
          count={nav.counts.all}
          active={tasksView && nav.scope === null && nav.filter !== 'today'}
          onClick={() => go(null, nav.filter === 'today' ? 'all' : undefined)}
        />
        <NavItem
          large={large}
          icon={<Sun className={icon} />}
          label="Today"
          count={nav.counts.today}
          active={tasksView && nav.scope === null && nav.filter === 'today'}
          onClick={() => go(null, 'today')}
        />
        <NavItem
          large={large}
          icon={<Category className={icon} />}
          label="Templates"
          active={nav.view === 'templates'}
          onClick={() => {
            nav.openTemplates();
            after?.();
          }}
        />
        <a
          href="/blog"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-2.5 text-fg/70 transition-[background-color,color] duration-150 ease-out hover:bg-hover hover:text-fg',
            large ? 'h-12 text-[15px]' : 'h-9 text-[13.5px]',
          )}
        >
          <span className="grid size-5 shrink-0 place-items-center text-muted">
            <BookOpen className={icon} />
          </span>
          Blog
        </a>
      </div>
      <div className="mt-6 mb-1 flex items-center justify-between pr-1 pl-2.5">
        <span className="text-[11.5px] font-medium tracking-[0.06em] text-faint uppercase">Lists</span>
        <button
          type="button"
          onClick={() => startNewList(!!large)}
          aria-label="New list"
          title="New list"
          className="grid size-6 place-items-center rounded-md text-faint transition-colors duration-150 hover:bg-hover hover:text-fg"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-0.5">
        {data.categories.map((c) => (
          <NavItem
            key={c.id}
            large={large}
            icon={<ListDot color={CATEGORY_COLORS[c.color]} />}
            label={c.name}
            count={nav.counts.byCategory.get(c.id)}
            active={tasksView && nav.scope === c.id}
            onClick={() => go(c.id, nav.filter === 'today' ? 'all' : undefined)}
            onDelete={() => nav.deleteList(c.id)}
          />
        ))}
        <NewListInput large={large} onCreated={(id) => go(id, 'all')} />
      </div>
    </>
  );
}

export function Sidebar({
  nav,
  onSettings,
  onNewTask,
  search,
}: {
  nav: NavState;
  onSettings: () => void;
  onNewTask: () => void;
  search: ReactNode;
}) {
  const { prefs } = useStore();
  const name = prefs.name.trim();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[256px] shrink-0 flex-col border-r border-line bg-sidebar md:flex">
      {/* Brand, separated from the controls below by a hairline. */}
      <div className="mx-3 flex h-16 items-center gap-2.5 border-b border-line px-2">
        <Logo />
        <span className="text-[16px] font-medium tracking-[-0.02em]">Taskdeck</span>
      </div>
      <div className="flex flex-col gap-2 px-3 pt-3 pb-3">
        {search}
        {/* Split button: main action adds a task; the chevron opens the Create menu. */}
        <div className="btn-primary flex h-11 rounded-[14px]">
          <button
            type="button"
            onClick={onNewTask}
            aria-label="New task"
            title="New task (N)"
            className="flex flex-1 items-center gap-2.5 rounded-l-[14px] pr-2 pl-3 text-[14.5px] font-medium"
          >
            <span className="grid size-[22px] place-items-center rounded-[7px] bg-accent-fg text-accent shadow-[0_1px_2px_rgb(0_0_0/0.15)]">
              <Plus className="size-3.5" strokeWidth={3} />
            </span>
            <span className="flex-1 text-left">New</span>
          </button>
          <span className="my-3 w-px bg-accent-fg/25" aria-hidden />
          <Popover
            align="end"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label="More ways to create"
                aria-expanded={open}
                className="grid h-11 w-10 place-items-center rounded-r-[14px] transition-colors hover:bg-accent-fg/10"
              >
                <ChevronDown className={cn('size-4 transition-transform duration-200 ease-out', open && 'rotate-180')} />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem icon={<Plus className="size-4" />} label="New task" hint="N" onClick={() => {
                    close();
                    onNewTask();
                  }}
                />
                <MenuItem icon={<Hashtag className="size-4" />} label="New list" onClick={() => {
                    close();
                    startNewList();
                  }}
                />
                <MenuItem icon={<Sparkles className="size-4" />} label="Use template" onClick={() => {
                    close();
                    nav.openTemplates();
                  }}
                />
              </>
            )}
          </Popover>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pt-1 pb-3" aria-label="Lists">
        <NavLists nav={nav} />
      </nav>
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={onSettings}
          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors duration-150 hover:bg-hover"
        >
          <Avatar className="size-9" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium">{name || 'Settings'}</span>
            <span className="block truncate text-[12px] text-muted">{name ? 'Settings & backup' : 'Theme, lists & backup'}</span>
          </span>
          <Settings2 className="size-4 shrink-0 text-faint" />
        </button>
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
  onAdd,
  listsOpen,
}: {
  nav: NavState;
  onLists: () => void;
  onSettings: () => void;
  onAdd: () => void;
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
          <span className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 font-medium text-accent-fg">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      {label}
    </button>
  );

  const tasksView = !listsOpen && nav.view === 'tasks';

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/85 pb-safe backdrop-blur-xl backdrop-saturate-150 md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md">
        {tab('Tasks', <ListCheck className="size-[22px]" />, tasksView && nav.scope === null && nav.filter !== 'today', () =>
          nav.go(null, nav.filter === 'today' ? 'all' : undefined),
        )}
        {tab('Today', <Sun className="size-[22px]" />, tasksView && nav.scope === null && nav.filter === 'today', () => nav.go(null, 'today'), nav.counts.today)}
        <div className="flex flex-1 items-start justify-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add task"
            className="btn-primary -mt-3 grid size-12 place-items-center rounded-full outline-4 outline-bg"
          >
            <Plus className="size-[22px]" strokeWidth={2.5} />
          </button>
        </div>
        {tab('Lists', <Layers className="size-[22px]" />, listsOpen || nav.view === 'templates' || nav.scope !== null, onLists)}
        {tab('Settings', <Settings2 className="size-[22px]" />, false, onSettings)}
      </div>
    </nav>
  );
}
