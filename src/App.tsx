import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCheck, ChevronRight, Coffee, Plus, Search, SearchX, Sparkles, X } from 'lucide-react';
import { useStore } from './store/store';
import type { Filter, Scope, Task } from './store/types';
import { selectView, todayStats } from './lib/filter';
import { greeting, longDate, todayKey } from './lib/date';
import { useIsDesktop, useMediaQuery, useNow } from './lib/hooks';
import { cn } from './lib/ui';
import { QuickAdd, type QuickAddHandle } from './components/QuickAdd';
import { TaskList } from './components/TaskList';
import { TaskDetail } from './components/TaskDetail';
import { Settings } from './components/Settings';
import { ConfirmDialog, type ConfirmOptions } from './components/Confirm';
import { EmptyState } from './components/EmptyState';
import { Modal } from './components/Modal';
import { ListsSheet, Logo, MobileTabBar, Sidebar, type NavState } from './components/Nav';
import { CategoryDot } from './components/pickers';
import { useToast } from './components/Toast';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'today', label: 'Today' },
  { id: 'completed', label: 'Completed' },
];

export default function App() {
  const store = useStore();
  const { data, prefs, setPrefs } = store;
  const toast = useToast();
  const isDesktop = useIsDesktop();
  const now = useNow();

  const [query, setQuery] = useState('');
  const [mobileSearch, setMobileSearch] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions | null>(null);

  const quickAddRef = useRef<QuickAddHandle>(null);
  // Separate refs: the sidebar (desktop) and top bar (mobile) inputs can both be mounted, one of them hidden.
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // Guard against a persisted scope pointing at a list that no longer exists.
  const scope: Scope = prefs.lastScope && data.categories.some((c) => c.id === prefs.lastScope) ? prefs.lastScope : null;
  const filter = prefs.lastFilter;
  const scopeCategory = data.categories.find((c) => c.id === scope);

  /* ---------- theme ---------- */
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && systemDark);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.dataset.accent = prefs.accent;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0d0e11' : '#fbfbfc');
  }, [dark, prefs.accent]);

  /* ---------- derived data ---------- */
  const categoryMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const view = useMemo(
    () => selectView(data.tasks, { scope, filter, query, showCompleted: prefs.showCompletedInAll || filter !== 'all' }),
    [data.tasks, scope, filter, query, prefs.showCompletedInAll],
  );
  const stats = useMemo(() => todayStats(data.tasks), [data.tasks, now]);
  const counts = useMemo(() => {
    const byCategory = new Map<string, number>();
    let all = 0;
    for (const t of data.tasks) {
      if (t.completed) continue;
      all++;
      if (t.categoryId) byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + 1);
    }
    return { all, today: stats.open, byCategory };
  }, [data.tasks, stats.open]);
  const scopedTodayCount = useMemo(() => {
    const today = todayKey();
    return data.tasks.filter((t) => (!scope || t.categoryId === scope) && !t.completed && t.dueDate && t.dueDate <= today).length;
  }, [data.tasks, scope, now]);

  /* ---------- navigation ---------- */
  const go = useCallback(
    (nextScope: Scope, nextFilter?: Filter) => {
      setPrefs({ lastScope: nextScope, ...(nextFilter ? { lastFilter: nextFilter } : {}) });
      setQuery('');
      setMobileSearch(false);
      window.scrollTo({ top: 0 });
    },
    [setPrefs],
  );
  const nav: NavState = { scope, filter, go, counts };

  /* ---------- actions ---------- */
  const defaults = { categoryId: scope, dueDate: filter === 'today' ? todayKey() : null };

  const onCreated = (task: Task) => {
    const cat = task.categoryId ? categoryMap.get(task.categoryId) : undefined;
    const hidden =
      !!query ||
      filter === 'completed' ||
      (scope !== null && task.categoryId !== scope) ||
      (filter === 'today' && !(task.dueDate && task.dueDate <= todayKey()));
    if (hidden) {
      toast(`Added to ${cat?.name ?? 'All tasks'}`, {
        action: { label: 'View', onClick: () => go(task.categoryId, 'all') },
      });
    }
  };

  const onToggle = useCallback((id: string) => store.toggleTask(id), [store]);
  const onOpen = useCallback((id: string) => setOpenTaskId(id), []);
  const onReorder = useCallback((a: string, b: string) => store.reorder(a, b), [store]);

  const onDelete = (task: Task) => {
    setOpenTaskId(null);
    const undo = store.deleteTask(task.id);
    toast('Task deleted', { action: { label: 'Undo', onClick: undo } });
  };

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('[role="dialog"]')) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (isDesktop) quickAddRef.current?.focus();
        else setComposerOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        if (!isDesktop) setMobileSearch(true);
        requestAnimationFrame(() => (isDesktop ? desktopSearchRef : mobileSearchRef).current?.focus());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDesktop]);

  /* ---------- render helpers ---------- */
  const title = query ? 'Search' : (scopeCategory?.name ?? (filter === 'today' ? 'Today' : 'All tasks'));
  const showCategory = scope === null;
  const isEmpty = view.active.length === 0 && view.completed.length === 0;
  const completedAsMain = filter === 'completed' && !query;
  const firstName = prefs.name.trim().split(/\s+/)[0];

  const renderSearch = (ref: React.RefObject<HTMLInputElement | null>) => (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
      <input
        ref={ref}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setQuery('');
            (e.target as HTMLInputElement).blur();
            setMobileSearch(false);
          }
        }}
        placeholder="Search tasks"
        aria-label="Search tasks"
        className="h-9 w-full rounded-xl border border-line bg-surface pr-8 pl-9 text-[14px] outline-none transition-colors placeholder:text-faint focus:border-line-strong md:h-8 md:rounded-lg md:text-[13.5px] [&::-webkit-search-cancel-button]:hidden"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            ref.current?.focus();
          }}
          className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded-md text-faint hover:text-fg"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border border-line px-1 font-sans text-[11px] text-faint md:block">
          /
        </kbd>
      )}
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <Sidebar nav={nav} onSettings={() => setSettingsOpen(true)} search={renderSearch(desktopSearchRef)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 border-b border-transparent bg-bg/85 pt-safe backdrop-blur-xl backdrop-saturate-150 md:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            {mobileSearch ? (
              <>
                {renderSearch(mobileSearchRef)}
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setMobileSearch(false);
                  }}
                  className="text-[14px] font-medium text-accent"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <Logo className="size-6" />
                <span className="flex-1 text-[16px] font-semibold tracking-[-0.02em]">Taskly</span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearch(true);
                    requestAnimationFrame(() => mobileSearchRef.current?.focus());
                  }}
                  className="grid size-9 place-items-center rounded-xl text-muted active:bg-hover"
                  aria-label="Search"
                >
                  <Search className="size-5" />
                </button>
              </>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pt-3 pb-40 sm:px-6 md:px-12 md:pt-12 md:pb-24">
          {/* Greeting */}
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 animate-rise-in">
              <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.025em] md:text-[30px]">
                {greeting(now)}
                {firstName && <span className="text-muted">, {firstName}</span>}
              </h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[14px] text-muted">
                <span className="sm:hidden">{now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span className="hidden sm:inline">{longDate(now)}</span>
                <span className="text-faint">·</span>
                <span>
                  {stats.total === 0
                    ? 'Nothing due today'
                    : stats.open === 0
                      ? 'All done for today 🎉'
                      : `${stats.open} task${stats.open === 1 ? '' : 's'} due today`}
                </span>
              </p>
            </div>
            <TodayRing done={stats.done} total={stats.total} />
          </div>

          {/* Quick add */}
          <div className="mt-6 md:mt-8">
            <QuickAdd ref={quickAddRef} defaults={defaults} onCreated={onCreated} />
          </div>

          {/* List header + filters */}
          <div className="mt-8 mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex min-w-0 items-center gap-2 px-1 text-[15px] font-semibold tracking-[-0.01em]">
              {scopeCategory && !query && <CategoryDot category={scopeCategory} className="size-2.5" />}
              <span className="truncate">{query ? `Results for “${query}”` : title}</span>
              <span className="text-[13px] font-normal text-faint tabular-nums">
                {(query ? view.active.length + view.completed.length : completedAsMain ? view.completed.length : view.active.length) || ''}
              </span>
            </h2>
            {!query && (
              <div role="tablist" aria-label="Filter tasks" className="-mx-1 flex gap-1 overflow-x-auto px-1 scrollbar-none sm:mx-0 sm:rounded-xl sm:bg-hover sm:p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.id}
                    onClick={() => setPrefs({ lastFilter: f.id })}
                    className={cn(
                      'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-all',
                      filter === f.id
                        ? 'bg-fg text-bg sm:bg-elevated sm:text-fg sm:shadow-soft'
                        : 'bg-hover text-muted hover:text-fg sm:bg-transparent',
                    )}
                  >
                    {f.label}
                    {f.id === 'today' && scopedTodayCount > 0 && (
                      <span className={cn('text-[11.5px] tabular-nums', filter === f.id ? 'opacity-60' : 'text-faint')}>{scopedTodayCount}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div key={`${scope}-${filter}-${!!query}`} className="animate-fade-in">
            {!completedAsMain && view.active.length > 0 && (
              <TaskList
                label={`${title} tasks`}
                tasks={view.active}
                categories={categoryMap}
                sortable={view.sortable}
                showCategory={showCategory || !!query}
                deferToggle
                query={query}
                onToggle={onToggle}
                onOpen={onOpen}
                onReorder={onReorder}
              />
            )}

            {completedAsMain && view.completed.length > 0 && (
              <TaskList
                label="Completed tasks"
                tasks={view.completed}
                categories={categoryMap}
                sortable={false}
                showCategory={showCategory}
                deferToggle
                onToggle={onToggle}
                onOpen={onOpen}
              />
            )}

            {!completedAsMain && view.active.length === 0 && view.completed.length > 0 && !query && (
              <p className="flex items-center gap-2 px-3 py-4 text-[13.5px] text-muted">
                <CheckCheck className="size-4 text-accent" /> Everything here is done. Nice work.
              </p>
            )}

            {!completedAsMain && view.completed.length > 0 && (
              <section className="mt-6">
                <button
                  type="button"
                  onClick={() => setPrefs({ completedOpen: !prefs.completedOpen })}
                  aria-expanded={prefs.completedOpen || !!query}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-fg"
                >
                  <ChevronRight className={cn('size-4 transition-transform duration-200', (prefs.completedOpen || query) && 'rotate-90')} />
                  Completed
                  <span className="text-faint tabular-nums">{view.completed.length}</span>
                </button>
                {(prefs.completedOpen || !!query) && (
                  <div className="mt-1 animate-fade-in">
                    <TaskList
                      label="Completed tasks"
                      tasks={view.completed}
                      categories={categoryMap}
                      sortable={false}
                      showCategory={showCategory || !!query}
                      deferToggle={false}
                      query={query}
                      onToggle={onToggle}
                      onOpen={onOpen}
                    />
                  </div>
                )}
              </section>
            )}

            {isEmpty && <Empty query={query} filter={filter} scopeName={scopeCategory?.name} hasAnyTasks={data.tasks.length > 0} onAdd={() => (isDesktop ? quickAddRef.current?.focus() : setComposerOpen(true))} />}
          </div>
        </main>
      </div>

      {/* Mobile */}
      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-30 grid size-14 place-items-center rounded-2xl bg-accent text-accent-fg shadow-float transition-transform active:scale-95 md:hidden"
        aria-label="Add task"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>
      <MobileTabBar nav={nav} listsOpen={listsOpen} onLists={() => setListsOpen(true)} onSettings={() => setSettingsOpen(true)} />
      <ListsSheet open={listsOpen} onClose={() => setListsOpen(false)} nav={nav} onManage={() => setSettingsOpen(true)} />
      <Modal open={composerOpen} onClose={() => setComposerOpen(false)} title="New task" hideHeader>
        <div className="pt-1">
          <QuickAdd
            variant="sheet"
            autoFocus
            defaults={defaults}
            onCreated={(t) => {
              setComposerOpen(false);
              onCreated(t);
            }}
          />
        </div>
      </Modal>

      <TaskDetail taskId={openTaskId} onClose={() => setOpenTaskId(null)} onDelete={onDelete} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} confirm={setConfirmOpts} />
      <ConfirmDialog options={confirmOpts} onClose={() => setConfirmOpts(null)} />
    </div>
  );
}

function TodayRing({ done, total }: { done: number; total: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <div
      className="relative grid size-11 shrink-0 place-items-center"
      role="img"
      aria-label={total ? `${done} of ${total} tasks done today` : 'No tasks due today'}
      title={total ? `${done} of ${total} done today` : 'No tasks due today'}
    >
      <svg viewBox="0 0 36 36" className="size-11 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--line-strong)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)', opacity: total ? 1 : 0 }}
        />
      </svg>
      <span className="absolute text-[11px] font-semibold text-muted tabular-nums">{total ? `${done}/${total}` : '–'}</span>
    </div>
  );
}

function Empty({
  query,
  filter,
  scopeName,
  hasAnyTasks,
  onAdd,
}: {
  query: string;
  filter: Filter;
  scopeName?: string;
  hasAnyTasks: boolean;
  onAdd: () => void;
}) {
  const add = (
    <button type="button" onClick={onAdd} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-4 text-[13.5px] font-semibold text-accent-fg transition-transform active:scale-[0.98]">
      <Plus className="size-4" /> Add a task
    </button>
  );
  if (query) return <EmptyState icon={<SearchX className="size-7" />} title="No matches" body={`Nothing matches “${query}”. Try a different word.`} />;
  if (filter === 'today') return <EmptyState icon={<Coffee className="size-7" />} title="Nothing due today" body="Enjoy the calm — or plan something for today." action={add} />;
  if (filter === 'completed') return <EmptyState icon={<CheckCheck className="size-7" />} title="Nothing completed yet" body="Tasks you check off will show up here." />;
  if (filter === 'active' && hasAnyTasks) return <EmptyState icon={<CheckCheck className="size-7" />} title="You’re all caught up" body="Every task here is done." action={add} />;
  if (scopeName) return <EmptyState icon={<Sparkles className="size-7" />} title={`${scopeName} is empty`} body="Add a task to this list to get started." action={add} />;
  return <EmptyState icon={<Sparkles className="size-7" />} title="A clear mind" body="Type a task above and press Enter. That’s it." action={add} />;
}
