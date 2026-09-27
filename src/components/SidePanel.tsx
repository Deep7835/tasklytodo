import { useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, Layers, Sun } from 'reicon-react';
import { CategoryDot } from './pickers';
import { daysFromToday, formatDue, fromKey, toKey } from '../lib/date';
import { CATEGORY_COLORS, cn } from '../lib/ui';
import type { Category, Scope, Task } from '../store/types';

type Stats = { open: number; overdue: number; done: number; total: number };

const WEEKS = 18;
const GREEN = '#30a46c';
/** Tile fill per activity level (0 = none), GitHub-style. */
const LEVEL_BG = ['var(--line)', ...[28, 50, 75, 100].map((p) => `color-mix(in oklab, ${GREEN} ${p}%, transparent)`)];

const dayLabel = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

/** Completions per day for the last 18 weeks, one column per week (Sun → Sat), like a GitHub contribution graph. */
function ActivityGraph({ tasks }: { tasks: Task[] }) {
  const [hover, setHover] = useState<{ date: Date; count: number } | null>(null);

  const { days, months, total, streak } = useMemo(() => {
    const perDay = new Map<string, number>();
    for (const t of tasks) {
      if (!t.completedAt) continue;
      const key = toKey(new Date(t.completedAt));
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

    const cells: { date: Date; count: number; future: boolean }[] = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      cells.push({ date, count: perDay.get(toKey(date)) ?? 0, future: date > today });
    }

    // Month label over the first week of each month, skipping ones that would collide.
    const labels: { col: number; text: string }[] = [];
    for (let w = 0; w < WEEKS; w++) {
      const first = cells[w * 7].date;
      const prev = w > 0 ? cells[(w - 1) * 7].date : null;
      if (prev && prev.getMonth() === first.getMonth()) continue;
      if (labels.length && w - labels[labels.length - 1].col < 3) labels.pop();
      labels.push({ col: w, text: first.toLocaleDateString(undefined, { month: 'short' }) });
    }

    let run = 0;
    for (const d = new Date(today); perDay.get(toKey(d)); d.setDate(d.getDate() - 1)) run++;

    return { days: cells, months: labels, total: cells.reduce((n, c) => n + c.count, 0), streak: run };
  }, [tasks]);

  const max = Math.max(1, ...days.map((d) => d.count));
  const level = (count: number) => (count === 0 ? 0 : Math.max(1, Math.ceil((count / max) * 4)));

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-[13px] font-medium">Activity</h4>
        {streak > 0 && (
          <span className="rounded-full bg-[#f07833]/12 px-2 py-0.5 text-[11.5px] font-medium text-[#e0691f] tabular-nums">🔥 {streak}-day streak</span>
        )}
      </div>

      <div className="mt-3 grid w-fit max-w-full gap-[3px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 14px))` }}>
        {months.map((m) => (
          <span key={m.col} className="text-[10.5px] whitespace-nowrap text-muted" style={{ gridColumn: m.col + 1, gridRow: 1 }}>
            {m.text}
          </span>
        ))}
      </div>
      <div
        className="mt-1 grid w-fit max-w-full grid-flow-col grid-rows-7 gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 14px))` }}
        role="img"
        aria-label={`${total} tasks completed in the last ${WEEKS} weeks`}
        onMouseLeave={() => setHover(null)}
      >
        {days.map((d) => (
          <span
            key={d.date.getTime()}
            title={d.future ? undefined : `${d.count} completed · ${dayLabel(d.date)}`}
            onMouseEnter={() => !d.future && setHover(d)}
            className={cn('aspect-square rounded-[3px] transition-[outline-color] duration-100', d.future ? 'invisible' : 'outline outline-1 -outline-offset-1 outline-transparent hover:outline-fg/40')}
            style={{ backgroundColor: LEVEL_BG[level(d.count)] }}
          />
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 text-[11.5px] text-muted">
        <span className="truncate tabular-nums">
          {hover ? `${hover.count} completed on ${dayLabel(hover.date)}` : `${total} done in ${WEEKS} weeks`}
        </span>
        <span className="flex shrink-0 items-center gap-1" aria-hidden>
          Less
          {LEVEL_BG.map((bg) => (
            <span key={bg} className="size-2.5 rounded-[2px]" style={{ backgroundColor: bg }} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}

/** Progress line filled with a left-to-right gradient of `color`; the fill slides in with transform only. */
function GradientBar({ ratio, color, label, className = 'h-1.5' }: { ratio: number; color: string; label: string; className?: string }) {
  return (
    <div
      className={cn('overflow-hidden rounded-full bg-line', className)}
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-transform duration-500 ease-out-soft"
        style={{
          backgroundImage: `linear-gradient(90deg, color-mix(in oklab, ${color} 55%, transparent), ${color} 70%, color-mix(in oklch, ${color}, white 22%))`,
          transform: `translateX(-${(1 - ratio) * 100}%)`,
        }}
      />
    </div>
  );
}

/** Big number over a small label, on a quiet tile. */
function Stat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-xl bg-section-muted px-3 py-2.5">
      <div className={cn('text-[22px] leading-none font-medium tracking-[-0.02em] tabular-nums', danger && 'text-[#e5484d]')}>{value}</div>
      <div className="mt-1.5 text-[12px] text-muted">{label}</div>
    </div>
  );
}

function CardTitle({ icon, title, right }: { icon: ReactNode; title: string; right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-[14px] font-medium tracking-[-0.01em]">
        <span className="text-muted">{icon}</span>
        {title}
      </h3>
      {right}
    </header>
  );
}

const CountBadge = ({ value }: { value: number }) => (
  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-line-strong px-1.5 text-[11.5px] font-medium text-muted tabular-nums">{value}</span>
);

export function TodaySummary({ stats, tasks, className = 'rounded-xl' }: { stats: Stats; tasks: Task[]; className?: string }) {
  const ratio = stats.total ? stats.done / stats.total : 0;
  const pct = Math.round(ratio * 100);
  return (
    <div className={cn('card-surface p-4', className)}>
      <CardTitle
        icon={<Sun className="size-4" />}
        title="Today so far"
        right={stats.total > 0 && <span className="text-[13px] font-medium text-accent tabular-nums">{pct}%</span>}
      />
      <div className={cn('mt-3 grid gap-2', stats.overdue ? 'grid-cols-3' : 'grid-cols-2')}>
        <Stat label="Due today" value={stats.open - stats.overdue} />
        {stats.overdue > 0 && <Stat label="Overdue" value={stats.overdue} danger />}
        <Stat label="Completed" value={stats.done} />
      </div>
      <GradientBar ratio={ratio} color="var(--accent)" label="Done today" className="mt-4 h-2" />
      <p className="mt-2 text-[12.5px] text-muted">{stats.total ? `${pct}% of today’s tasks done` : 'Nothing due today'}</p>
      <ActivityGraph tasks={tasks} />
    </div>
  );
}

function Card({ title, icon, meta, children }: { title: string; icon: ReactNode; meta?: number; children: ReactNode }) {
  return (
    <section className="card-surface rounded-[20px] p-4">
      <CardTitle icon={icon} title={title} right={meta != null && <CountBadge value={meta} />} />
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Upcoming({ tasks, categories, onOpen }: { tasks: Task[]; categories: Category[]; onOpen: (id: string) => void }) {
  const dated = tasks.filter((t) => !t.completed && t.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const byId = new Map(categories.map((c) => [c.id, c]));

  return (
    <Card title="Upcoming" icon={<CalendarDays className="size-4" />} meta={dated.length}>
      {dated.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-3 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-section-muted text-muted">
            <CalendarDays className="size-4" />
          </span>
          <p className="text-[12.5px] leading-snug text-muted">Nothing scheduled. Give a task a due date to see it here.</p>
        </div>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {dated.slice(0, 5).map((t) => {
            const date = fromKey(t.dueDate!);
            const overdue = daysFromToday(t.dueDate!) < 0;
            const category = t.categoryId ? byId.get(t.categoryId) : undefined;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpen(t.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors duration-150 hover:bg-hover"
                >
                  <span
                    className={cn(
                      'flex size-10 shrink-0 flex-col items-center justify-center rounded-[10px] leading-none',
                      overdue ? 'bg-[#e5484d]/12 text-[#e5484d]' : 'bg-section text-fg',
                    )}
                  >
                    <span className="text-[15px] font-medium tabular-nums">{date.getDate()}</span>
                    <span className={cn('mt-0.5 text-[10px] uppercase', !overdue && 'text-muted')}>{date.toLocaleDateString(undefined, { month: 'short' })}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px]">{t.title}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                      <span className={cn(overdue && 'text-[#e5484d]')}>{formatDue(t.dueDate!)}</span>
                      {category && (
                        <>
                          <span className="text-faint">·</span>
                          <CategoryDot category={category} className="size-1.5" />
                          <span className="truncate">{category.name}</span>
                        </>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Lists({ tasks, categories, scope, onScope }: { tasks: Task[]; categories: Category[]; scope: Scope; onScope: (id: string) => void }) {
  return (
    <Card title="Lists" icon={<Layers className="size-4" />} meta={categories.length}>
      {categories.length === 0 ? (
        <p className="text-[13px] text-muted">No lists yet.</p>
      ) : (
        <ul className="-mx-2 flex flex-col gap-0.5">
          {categories.map((c) => {
            const mine = tasks.filter((t) => t.categoryId === c.id);
            const done = mine.filter((t) => t.completed).length;
            const ratio = mine.length ? done / mine.length : 0;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onScope(c.id)}
                  aria-current={scope === c.id ? 'true' : undefined}
                  className={cn('w-full rounded-xl px-2 py-2 text-left transition-colors duration-150 hover:bg-hover', scope === c.id && 'bg-hover')}
                >
                  <span className="flex items-center gap-2 text-[13.5px]">
                    <CategoryDot category={c} className="size-2" />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="text-[12px] text-muted tabular-nums">
                      {done}/{mine.length}
                    </span>
                    <span className="w-9 text-right text-[12px] font-medium tabular-nums" style={{ color: CATEGORY_COLORS[c.color] }}>
                      {Math.round(ratio * 100)}%
                    </span>
                  </span>
                  <GradientBar ratio={ratio} color={CATEGORY_COLORS[c.color]} label={`${c.name} progress`} className="mt-2 h-1.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function SidePanel({
  stats,
  tasks,
  categories,
  scope,
  onOpen,
  onScope,
}: {
  stats: Stats;
  tasks: Task[];
  categories: Category[];
  scope: Scope;
  onOpen: (id: string) => void;
  onScope: (id: string) => void;
}) {
  return (
    <aside aria-label="Overview" className="hidden xl:sticky xl:top-10 xl:flex xl:flex-col xl:gap-4">
      <TodaySummary stats={stats} tasks={tasks} className="rounded-[20px]" />
      <Upcoming tasks={tasks} categories={categories} onOpen={onOpen} />
      <Lists tasks={tasks} categories={categories} scope={scope} onScope={onScope} />
    </aside>
  );
}
