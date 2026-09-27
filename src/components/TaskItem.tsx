import { memo, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { CalendarDays, Flag, Menu } from 'reicon-react';
import { Checkbox } from './Checkbox';
import { CategoryDot } from './pickers';
import { daysFromToday, formatDue } from '../lib/date';
import { PRIORITY_COLOR, cn } from '../lib/ui';
import { PRIORITY_LABEL, type Category, type Task } from '../store/types';

interface Props {
  task: Task;
  category?: Category;
  showCategory: boolean;
  query?: string;
  /** Delay the store update so the check animation is visible before the row leaves the list. */
  deferToggle?: boolean;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  // Drag & drop wiring (optional).
  dragging?: boolean;
  sortable?: boolean;
  style?: CSSProperties;
  rowProps?: HTMLAttributes<HTMLLIElement>;
  handleProps?: HTMLAttributes<HTMLButtonElement>;
  setRef?: (el: HTMLLIElement | null) => void;
  setHandleRef?: (el: HTMLButtonElement | null) => void;
}

function Highlight({ text, query }: { text: string; query?: string }) {
  const q = query?.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-accent-soft px-0.5 text-fg">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function dueTone(key: string, completed: boolean) {
  if (completed) return 'bg-hover text-faint';
  const d = daysFromToday(key);
  if (d < 0) return 'bg-[#e5484d]/12 text-[#e5484d]';
  if (d === 0) return 'bg-accent-soft text-accent';
  if (d === 1) return 'bg-[#e6a117]/15 text-[#b8700a] dark:text-[#eba23a]';
  return 'bg-hover text-muted';
}

export const TaskItem = memo(function TaskItem({
  task,
  category,
  showCategory,
  query,
  deferToggle,
  onToggle,
  onOpen,
  dragging,
  sortable,
  style,
  rowProps,
  handleProps,
  setRef,
  setHandleRef,
}: Props) {
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => setPending(false), [task.completed]);

  const checked = pending ? !task.completed : task.completed;

  const toggle = () => {
    if (pending) {
      clearTimeout(timer.current);
      setPending(false);
      return;
    }
    if (deferToggle) {
      setPending(true);
      timer.current = setTimeout(() => onToggle(task.id), 420);
    } else {
      onToggle(task.id);
    }
  };

  const hasMeta = task.dueDate || (showCategory && category) || (task.priority > 0 && !checked);
  const priorityTint = PRIORITY_COLOR[task.priority];

  return (
    <li
      ref={setRef}
      style={style}
      {...rowProps}
      className={cn('group/row relative list-none rounded-xl no-callout', dragging && 'z-10')}
      data-task-id={task.id}
    >
      {sortable && (
        <button
          ref={setHandleRef}
          type="button"
          {...handleProps}
          aria-label={`Reorder “${task.title}”`}
          className="absolute top-1/2 -left-9 hidden size-6 -translate-y-1/2 cursor-grab touch-none place-items-center rounded-md text-faint opacity-0 transition-opacity group-hover/row:opacity-100 hover:text-muted focus-visible:opacity-100 active:cursor-grabbing md:grid"
        >
          <Menu className="size-4" />
        </button>
      )}
      <div
        className={cn(
          'rounded-xl border px-3.5 py-3 transition-[background-color,box-shadow,border-color,transform] duration-150 ease-out',
          !dragging && 'active:scale-[0.985]',
          dragging
            ? 'border-line-strong bg-elevated shadow-float'
            : checked
              ? 'border-transparent bg-card/60'
              : 'border-line bg-card hover:bg-elevated hover:shadow-soft',
        )}
      >
        <div className="flex items-start gap-3">
          <div className="pt-[1px]">
            <Checkbox checked={checked} priority={task.priority} onChange={toggle} label={`Mark “${task.title}” as ${checked ? 'not done' : 'done'}`} />
          </div>
          <button
            type="button"
            onClick={() => onOpen(task.id)}
            className="min-w-0 flex-1 text-left outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <span
              className={cn(
                'block text-[14.5px] leading-[1.35rem] font-medium break-words transition-colors duration-200',
                checked ? 'text-faint line-through decoration-faint/70' : 'text-fg',
              )}
            >
              <Highlight text={task.title} query={query} />
            </span>
            {task.notes && (
              <span className={cn('mt-0.5 block truncate text-[13px] leading-5', checked ? 'text-faint' : 'text-muted')}>
                <Highlight text={task.notes.split('\n')[0]} query={query} />
              </span>
            )}
          </button>
        </div>
        {hasMeta && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-[31px] text-[12.5px] leading-5 text-muted">
            {showCategory && category && (
              <span className="inline-flex items-center gap-1.5">
                <CategoryDot category={category} className="size-[7px]" />
                {category.name}
              </span>
            )}
            {task.dueDate && (
              <span className={cn('inline-flex h-[22px] items-center gap-1 rounded-md px-1.5 font-medium', dueTone(task.dueDate, checked))}>
                <CalendarDays className="size-3" />
                {formatDue(task.dueDate)}
              </span>
            )}
            {task.priority > 0 && !checked && priorityTint && (
              <span
                className="inline-flex h-[22px] items-center gap-1 rounded-md px-1.5 font-medium"
                style={{ color: priorityTint, backgroundColor: `color-mix(in oklab, ${priorityTint} 13%, transparent)` }}
              >
                <Flag className="size-3" />
                {PRIORITY_LABEL[task.priority]}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
});
