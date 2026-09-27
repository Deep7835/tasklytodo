import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckRead, ChevronDown, Coffee, Hashtag, Inbox, Plus, Search, SearchMinus, Sparkles, Sun, Trash2, X } from 'reicon-react';
import { useStore } from './store/store';
import type { Filter, Scope, Task } from './store/types';
import { selectView, todayStats } from './lib/filter';
import { greeting, isDueToday, isOverdue, longDate, todayKey } from './lib/date';
import { useIsDesktop, useMediaQuery, useNow, useScrolledPast } from './lib/hooks';
import { cn } from './lib/ui';
import { QuickAdd, type QuickAddHandle } from './components/QuickAdd';
import { TaskList } from './components/TaskList';
import { TaskDetail } from './components/TaskDetail';
import { Settings } from './components/Settings';
import { ConfirmDialog, type ConfirmOptions } from './components/Confirm';
import { EmptyState } from './components/EmptyState';
import { Modal } from './components/Modal';
import { ListsSheet, Logo, MobileTabBar, Sidebar, startNewList, type NavState } from './components/Nav';
import { TemplatesView } from './components/Templates';
import { taskCount, templateColor, templateItems, type Template } from './lib/templates';
import { CategoryDot } from './components/pickers';
import { useToast } from './components/Toast';
import { SidePanel, TodaySummary } from './components/SidePanel';
import { Avatar } from './components/Avatar';

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
  // Mobile top bar: gains a blurred background once content scrolls under it, then swaps in the view title.
  const scrolled = useScrolledPast(4);
  const pastTitle = useScrolledPast(64);

  const [query, setQuery] = useState('');
  const [mobileSearch, setMobileSearch] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [mainView, setMainView] = useState<'tasks' | 'templates'>('tasks');
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
  const filterCounts = useMemo(() => {
    const today = todayKey();
    const c: Record<Filter, number> = { all: 0, active: 0, today: 0, completed: 0 };
    for (const t of data.tasks) {
      if (scope && t.categoryId !== scope) continue;
      c.all++;
      if (t.completed) c.completed++;
      else {
        c.active++;
        if (t.dueDate && t.dueDate <= today) c.today++;
      }
    }
    return c;
  }, [data.tasks, scope, now]);

  /* ---------- navigation ---------- */
  const go = useCallback(
    (nextScope: Scope, nextFilter?: Filter) => {
      setPrefs({ lastScope: nextScope, ...(nextFilter ? { lastFilter: nextFilter } : {}) });
      setMainView('tasks');
      setQuery('');
      setMobileSearch(false);
      window.scrollTo({ top: 0 });
    },
    [setPrefs],
  );
  const openTemplates = useCallback(() => {
    setMainView('templates');
    setQuery('');
    setMobileSearch(false);
    window.scrollTo({ top: 0 });
  }, []);
  const deleteList = (id: string) => {
    const list = categoryMap.get(id);
    if (!list) return;
    const count = data.tasks.filter((t) => t.categoryId === id).length;
    const remove = (withTasks: boolean) => {
      const undo = store.deleteCategory(id, withTasks);
      if (scope === id) go(null);
      toast(`Deleted “${list.name}”${withTasks && count ? ` and ${count} task${count === 1 ? '' : 's'}` : ''}`, { action: { label: 'Undo', onClick: undo } });
    };
    setConfirmOpts({
      title: `Delete “${list.name}”?`,
      message: count
        ? `This list has ${count} task${count === 1 ? '' : 's'}. Delete ${count === 1 ? 'it' : 'them'} too, or keep ${count === 1 ? 'it' : 'them'} in All tasks?`
        : 'This list is empty.',
      actions: count
        ? [
            { label: 'Keep tasks', tone: 'default', onClick: () => remove(false) },
            { label: `Delete ${count} task${count === 1 ? '' : 's'} too`, tone: 'danger', onClick: () => remove(true) },
          ]
        : [{ label: 'Delete list', tone: 'danger', onClick: () => remove(false) }],
    });
  };
  const nav: NavState = { scope, filter, view: mainView, go, openTemplates, deleteList, counts };

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

  /** Desktop focuses the inline composer (switching back from Templates if needed); phones open the sheet. */
  const [focusComposer, setFocusComposer] = useState(0);
  const startNewTask = () => {
    if (!isDesktop) return setComposerOpen(true);
    setMainView('tasks');
    setFocusComposer((n) => n + 1);
  };
  // Runs after the render, so the composer exists even when coming back from Templates.
  useEffect(() => {
    if (focusComposer) quickAddRef.current?.focus();
  }, [focusComposer]);

  // Templates are copied: the new list and its tasks are independent of the template from here on.
  const applyTemplate = (template: Template) => {
    const taken = new Set(data.categories.map((c) => c.name.toLowerCase()));
    let name = template.name;
    for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${template.name} ${n}`;
    const list = store.addList(name, templateColor(template), templateItems(template));
    go(list.id, 'all');
    toast(`Created “${name}” with ${taskCount(template)} tasks`);
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
        startNewTask();
      } else if (e.key === '/') {
        e.preventDefault();
        if (!isDesktop) setMobileSearch(true);
        requestAnimationFrame(() => (isDesktop ? desktopSearchRef : mobileSearchRef).current?.focus());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ---------- render helpers ---------- */
  const title = query ? 'Search' : (scopeCategory?.name ?? (filter === 'today' ? 'Today' : 'All tasks'));
  const showCategory = scope === null;
  const isEmpty = view.active.length === 0 && view.completed.length === 0;
  const completedAsMain = filter === 'completed' && !query;
  const firstName = prefs.name.trim().split(/\s+/)[0];
  const mainCount = query ? view.active.length + view.completed.length : completedAsMain ? view.completed.length : view.active.length;
  const overdueInView = view.active.filter((t) => isOverdue(t.dueDate)).length;
  const dueTodayInView = view.active.filter((t) => isDueToday(t.dueDate)).length;
  const mainMeta = query || completedAsMain ? null : overdueInView ? `${overdueInView} overdue` : dueTodayInView ? `${dueTodayInView} due today` : null;
  // Inside a list, tasks with a section are grouped under its heading (ungrouped tasks first).
  const activeGroups = useMemo(() => groupBySection(view.active, scope !== null && !query), [view.active, scope, query]);
  const showSummary = !query && scope === null && filter !== 'completed' && stats.total > 0;

  // Same filters, two looks: pill chips with counts in the lg+ header, a segmented control below that.
  const renderFilters = (variant: 'chips' | 'segmented') => {
    const chips = variant === 'chips';
    return (
      <div
        role="tablist"
        aria-label="Filter tasks"
        className={chips ? 'hidden shrink-0 gap-1.5 lg:flex' : 'mt-5 grid grid-cols-4 gap-1 rounded-[14px] bg-section-muted p-1 lg:hidden'}
      >
        {FILTERS.map((f) => {
          const selected = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setPrefs({ lastFilter: f.id })}
              className={cn(
                'inline-flex items-center text-[13px] font-medium transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.97]',
                chips
                  ? cn('h-8 gap-1.5 rounded-full pr-1.5 pl-3', selected ? 'bg-fg text-bg' : 'bg-section-muted text-fg/80 hover:bg-line-strong hover:text-fg')
                  : cn('h-9 justify-center rounded-[10px] px-1', selected ? 'bg-elevated text-fg shadow-soft dark:bg-white/12' : 'text-muted hover:text-fg'),
              )}
            >
              {f.label}
              {chips && (
                <span
                  className={cn(
                    'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-medium tabular-nums',
                    selected ? 'bg-bg/20 text-bg' : 'bg-line-strong text-muted',
                  )}
                >
                  {filterCounts[f.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderSearch = (ref: React.RefObject<HTMLInputElement | null>) => (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
      <input
        ref={ref}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setMainView('tasks');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setQuery('');
            (e.target as HTMLInputElement).blur();
            setMobileSearch(false);
          }
        }}
        placeholder="Search tasks"
        aria-label="Search tasks"
        className="h-9 w-full rounded-xl border border-line bg-surface pr-8 pl-9 text-[14px] outline-none transition-colors placeholder:text-faint focus:border-line-strong md:h-9 md:rounded-xl md:text-[13.5px] [&::-webkit-search-cancel-button]:hidden"
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
      <Sidebar nav={nav} onSettings={() => setSettingsOpen(true)} onNewTask={startNewTask} search={renderSearch(desktopSearchRef)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header
          className={cn(
            'sticky top-0 z-20 border-b pt-safe transition-[background-color,border-color] duration-200 md:hidden',
            scrolled || mobileSearch ? 'border-line bg-bg/80 backdrop-blur-xl backdrop-saturate-150' : 'border-transparent bg-bg',
          )}
        >
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
                {/* Large-title pattern: once the greeting scrolls away, the bar shows the current view's name. */}
                <span className="relative h-6 min-w-0 flex-1 overflow-hidden text-[16px] leading-6 font-medium tracking-[-0.02em]">
                  <span className={cn('absolute inset-0 transition-[opacity,transform] duration-200 ease-out', pastTitle && '-translate-y-3 opacity-0')}>Taskdeck</span>
                  <span
                    aria-hidden={!pastTitle}
                    className={cn('absolute inset-0 truncate transition-[opacity,transform] duration-200 ease-out', !pastTitle && 'translate-y-3 opacity-0')}
                  >
                    {mainView === 'templates' ? 'Templates' : query ? 'Search' : title}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearch(true);
                    requestAnimationFrame(() => mobileSearchRef.current?.focus());
                  }}
                  className="grid size-9 place-items-center rounded-full bg-section-muted text-fg/80 transition-transform duration-150 ease-out active:scale-95"
                  aria-label="Search"
                >
                  <Search className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Profile and settings"
                  className="rounded-full transition-transform duration-150 ease-out active:scale-95"
                >
                  <Avatar className="size-9" />
                </button>
              </>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pt-3 pb-40 sm:px-6 md:px-12 md:pt-8 md:pb-24 lg:max-w-none lg:px-10 xl:grid xl:max-w-[1480px] xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:gap-8 xl:px-8">
          <div className="min-w-0">
          {mainView === 'templates' ? (
            <TemplatesView onUse={applyTemplate} />
          ) : (
          <>
          {/* Header: greeting, plus filter chips on the right from lg up */}
          <div className="flex items-start justify-between gap-6 lg:items-end">
            <div className="min-w-0 flex-1 animate-rise-in lg:flex-initial">
              <p className="text-[12px] font-medium tracking-[0.06em] text-muted uppercase">{longDate(now)}</p>
              {/* Phones stack the status row under the title; wider screens keep it on the same line. */}
              <div className="mt-1 flex flex-col items-start gap-2.5 md:flex-row md:flex-wrap md:items-center md:gap-x-3 md:gap-y-2">
                <h1 className="text-[28px] leading-tight font-medium tracking-[-0.025em] md:text-[24px] md:whitespace-nowrap">
                  {greeting(now)}
                  {firstName && <span className="text-muted">, {firstName}</span>}
                </h1>
                {/* Status pill, with today's battery beside it below lg (the side panel covers it on wide screens). */}
                <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-start">
                  <TodayStatus stats={stats} />
                  <span className="lg:hidden">
                    <TodayBattery done={stats.done} total={stats.total} />
                  </span>
                </div>
              </div>
            </div>
            {!query && renderFilters('chips')}
          </div>

          {/* Quick add (phones add through the + in the tab bar instead) */}
          <div className="mt-5 hidden md:block">
            <QuickAdd ref={quickAddRef} defaults={defaults} onCreated={onCreated} />
          </div>

          {/* Filters below lg: full-width segmented control */}
          {!query && renderFilters('segmented')}

          {/* Tasks */}
          <div key={`${scope}-${filter}-${!!query}`} className="mt-4 flex animate-fade-in flex-col gap-4">
            <Section
              title={query ? `Results for “${query}”` : title}
              icon={
                query ? (
                  <Search className="size-[18px]" />
                ) : scopeCategory ? (
                  <CategoryDot category={scopeCategory} className="size-2.5" />
                ) : filter === 'today' ? (
                  <Sun className="size-[18px]" />
                ) : completedAsMain ? (
                  <CheckRead className="size-[18px]" />
                ) : (
                  <Inbox className="size-[18px]" />
                )
              }
              count={mainCount}
              meta={mainMeta}
              metaTone={overdueInView ? 'danger' : 'muted'}
              footer={
                !query &&
                !completedAsMain && (
                  <>
                    <button
                      type="button"
                      onClick={startNewTask}
                      className="inline-flex items-center gap-1.5 font-medium text-fg underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-fg"
                    >
                      <Plus className="size-3.5" strokeWidth={2.5} />
                      Add task
                    </button>
                    <span className="inline-flex items-center gap-1.5 text-muted tabular-nums">
                      <CheckRead className="size-4" />
                      {filter === 'today' && scope === null
                        ? `${stats.done}/${stats.total} done today`
                        : `${filterCounts.completed}/${filterCounts.all} done`}
                    </span>
                  </>
                )
              }
            >
              {showSummary && (
                <div className="xl:hidden">
                  <TodaySummary stats={stats} tasks={data.tasks} />
                </div>
              )}

              {!completedAsMain &&
                activeGroups.map((g) => (
                  <div key={g.section ?? ''} className="flex flex-col gap-2">
                    {g.section && (
                      <h3 className="flex items-center gap-2 px-2 pt-2 text-[11.5px] font-medium tracking-[0.06em] text-muted uppercase">
                        {g.section}
                        <span className="text-faint tabular-nums">{g.tasks.length}</span>
                      </h3>
                    )}
                    <TaskList
                      label={g.section ? `${g.section} tasks` : `${title} tasks`}
                      tasks={g.tasks}
                      categories={categoryMap}
                      sortable={view.sortable}
                      showCategory={showCategory || !!query}
                      deferToggle
                      query={query}
                      onToggle={onToggle}
                      onOpen={onOpen}
                      onReorder={onReorder}
                    />
                  </div>
                ))}

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
                <p className="flex items-center gap-2 px-2 py-3 text-[13.5px] text-muted">
                  <CheckRead className="size-4 text-accent" /> Everything here is done. Nice work.
                </p>
              )}

              {isEmpty && <Empty query={query} filter={filter} scopeName={scopeCategory?.name} hasAnyTasks={data.tasks.length > 0} onAdd={startNewTask} />}
            </Section>

            {!completedAsMain && view.completed.length > 0 && (
              <Section
                title="Completed"
                icon={<CheckRead className="size-[18px]" />}
                count={view.completed.length}
                open={prefs.completedOpen || !!query}
                onToggle={() => setPrefs({ completedOpen: !prefs.completedOpen })}
                footer={
                  scope === null &&
                  !query && (
                    <>
                      <span className="text-muted">Checked-off tasks stay here until you clear them.</span>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmOpts({
                            title: 'Clear completed tasks?',
                            message: `This removes ${filterCounts.completed} completed task${filterCounts.completed === 1 ? '' : 's'}.`,
                            actions: [
                              {
                                label: 'Clear',
                                tone: 'danger',
                                onClick: () => {
                                  const undo = store.clearCompleted();
                                  toast('Completed tasks cleared', { action: { label: 'Undo', onClick: undo } });
                                },
                              },
                            ],
                          })
                        }
                        className="inline-flex shrink-0 items-center gap-1.5 font-medium text-muted transition-colors duration-150 hover:text-[#e5484d]"
                      >
                        <Trash2 className="size-4" />
                        Clear completed
                      </button>
                    </>
                  )
                }
              >
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
              </Section>
            )}
          </div>
          </>
          )}
          </div>

          {/* Desktop side panel: fills the empty right side on wide screens. */}
          <SidePanel stats={stats} tasks={data.tasks} categories={data.categories} scope={scope} onOpen={onOpen} onScope={(id) => go(id, 'all')} />
        </main>
      </div>

      {/* Mobile */}
      <MobileTabBar
        nav={nav}
        listsOpen={listsOpen}
        onLists={() => setListsOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onAdd={() => setComposerOpen(true)}
      />
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
          <div className="flex gap-2 border-t border-line px-5 pt-3 pb-4">
            <button
              type="button"
              onClick={() => {
                setComposerOpen(false);
                setListsOpen(true);
                // Wait for the Lists sheet to mount before opening its "New list" field.
                setTimeout(() => startNewList(true), 50);
              }}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-hover text-[13.5px] font-medium transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              <Hashtag className="size-4 text-muted" />
              New list
            </button>
            <button
              type="button"
              onClick={() => {
                setComposerOpen(false);
                openTemplates();
              }}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-hover text-[13.5px] font-medium transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              <Sparkles className="size-4 text-muted" />
              Use template
            </button>
          </div>
        </div>
      </Modal>

      <TaskDetail taskId={openTaskId} onClose={() => setOpenTaskId(null)} onDelete={onDelete} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} confirm={setConfirmOpts} />
      <ConfirmDialog options={confirmOpts} onClose={() => setConfirmOpts(null)} />
    </div>
  );
}

/** Bordered card grouping task cards: icon + title, tag chips, body, and an optional footer bar for actions. */
function Section({
  title,
  icon,
  count,
  meta,
  metaTone = 'muted',
  open,
  onToggle,
  footer,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  meta?: string | null;
  metaTone?: 'muted' | 'danger';
  open?: boolean;
  onToggle?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const expanded = !onToggle || open;
  const Title = onToggle ? 'span' : 'h2';
  const header = (
    <>
      <span className="grid size-5 shrink-0 place-items-center text-muted">{icon}</span>
      <Title className="min-w-0 truncate text-[15.5px] font-medium tracking-[-0.01em]">{title}</Title>
      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
        {count > 0 && (
          <span className="inline-flex h-6 items-center rounded-full border border-line-strong px-2 text-[12px] font-medium text-fg/80 tabular-nums">
            {count} {count === 1 ? 'task' : 'tasks'}
          </span>
        )}
        {meta && (
          <span
            className={cn(
              'inline-flex h-6 items-center rounded-full px-2 text-[12px] font-medium tabular-nums',
              metaTone === 'danger' ? 'bg-[#e5484d]/12 text-[#e5484d]' : 'bg-section-muted text-fg/80',
            )}
          >
            {meta}
          </span>
        )}
      </span>
      {onToggle && <ChevronDown className={cn('ml-auto size-4 shrink-0 text-muted transition-transform duration-200 ease-out', !expanded && '-rotate-90')} />}
    </>
  );
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-elevated">
      {onToggle ? (
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-hover">
          {header}
        </button>
      ) : (
        <div className="flex items-center gap-2.5 px-4 py-3.5">{header}</div>
      )}
      {expanded && <div className="flex animate-fade-in flex-col gap-2 px-2 pb-2">{children}</div>}
      {expanded && footer && (
        <div className="flex items-center justify-between gap-3 border-t border-line bg-section-muted/70 px-4 py-2.5 text-[13px]">{footer}</div>
      )}
    </section>
  );
}

const DONE_GREEN = '#30a46c';

/** Today's state as a tinted pill: calm when empty, accent when tasks are due, red when overdue, green when done. */
function TodayStatus({ stats }: { stats: { open: number; overdue: number; done: number; total: number } }) {
  const pill = 'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium';
  if (stats.total === 0)
    return (
      <span className={cn(pill, 'bg-section-muted text-muted')}>
        <Coffee className="size-3.5" />
        Nothing due today
      </span>
    );
  if (stats.open === 0)
    return (
      <span className={pill} style={{ color: DONE_GREEN, backgroundColor: `color-mix(in oklab, ${DONE_GREEN} 13%, transparent)` }}>
        <CheckRead className="size-3.5" />
        All done for today
      </span>
    );
  const dueToday = stats.open - stats.overdue;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {dueToday > 0 && (
        <span className={cn(pill, 'bg-accent-soft text-accent')}>
          <Sun className="size-3.5" />
          {dueToday} due today
        </span>
      )}
      {stats.overdue > 0 && <span className={cn(pill, 'bg-[#e5484d]/12 text-[#e5484d]')}>{stats.overdue} overdue</span>}
    </span>
  );
}

const BATTERY_CELLS = 5;

/** Today's progress as a compact battery: GitHub-green cells fill left to right, with the percentage beside it. */
function TodayBattery({ done, total }: { done: number; total: number }) {
  const pct = total ? done / total : 0;
  const filled = Math.round(pct * BATTERY_CELLS);
  const complete = total > 0 && done === total;
  return (
    <span
      className={cn('flex shrink-0 items-center gap-2', !total && 'opacity-60')}
      role="img"
      aria-label={total ? `${done} of ${total} tasks done today` : 'No tasks due today'}
      title={total ? `${done} of ${total} done today` : 'No tasks due today'}
    >
      <span className="flex items-center">
        <span className="flex h-[22px] w-[50px] gap-[2px] rounded-[7px] border-[1.5px] border-fg/30 p-[2px]">
          {Array.from({ length: BATTERY_CELLS }, (_, i) => (
            <span
              key={i}
              className="flex-1 rounded-[3px] transition-[background-color] duration-300 ease-out"
              // Filled cells deepen toward the right, like the activity graph's levels.
              style={{
                backgroundColor:
                  i < filled ? `color-mix(in oklab, ${DONE_GREEN} ${45 + (i * 55) / (BATTERY_CELLS - 1)}%, transparent)` : 'var(--line-strong)',
              }}
            />
          ))}
        </span>
        <span className="ml-[1.5px] h-2 w-[2.5px] rounded-r-[2px] bg-fg/30" aria-hidden />
      </span>
      <span className="min-w-8 text-[12.5px] font-medium text-muted tabular-nums" style={{ color: complete ? DONE_GREEN : undefined }}>
        {total ? `${Math.round(pct * 100)}%` : '–'}
      </span>
    </span>
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
    <button type="button" onClick={onAdd} className="btn-primary inline-flex h-10 items-center gap-2 rounded-[13px] pr-4 pl-3 text-[13.5px] font-medium">
      <Plus className="size-4" /> Add a task
    </button>
  );
  if (query) return <EmptyState icon={<SearchMinus className="size-7" />} title="No matches" body={`Nothing matches “${query}”. Try a different word.`} />;
  if (filter === 'today') return <EmptyState icon={<Coffee className="size-7" />} title="Nothing due today" body="Enjoy the calm — or plan something for today." action={add} />;
  if (filter === 'completed') return <EmptyState icon={<CheckRead className="size-7" />} title="Nothing completed yet" body="Tasks you check off will show up here." />;
  if (filter === 'active' && hasAnyTasks) return <EmptyState icon={<CheckRead className="size-7" />} title="You’re all caught up" body="Every task here is done." action={add} />;
  if (scopeName) return <EmptyState icon={<Sparkles className="size-7" />} title={`${scopeName} is empty`} body="Add a task to this list to get started." action={add} />;
  return <EmptyState icon={<Sparkles className="size-7" />} title="A clear mind" body="Type a task above and press Enter. That’s it." action={add} />;
}

function groupBySection(tasks: Task[], enabled: boolean): { section: string | null; tasks: Task[] }[] {
  if (!enabled) return [{ section: null, tasks }];
  const groups = new Map<string | null, Task[]>([[null, []]]);
  for (const t of tasks) {
    const list = groups.get(t.section);
    if (list) list.push(t);
    else groups.set(t.section, [t]);
  }
  return [...groups].map(([section, items]) => ({ section, tasks: items })).filter((g) => g.tasks.length > 0);
}
