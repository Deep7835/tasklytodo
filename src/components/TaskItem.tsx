import { memo, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { CalendarDays, GripVertical, NotebookText } from 'lucide-react';
import { Checkbox } from './Checkbox';
import { CategoryDot } from './pickers';
import { daysFromToday, formatDue } from '../lib/date';
import { cn } from '../lib/ui';
import type { Category, Task } from '../store/types';

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
  if (completed) return 'text-faint';
  const d = daysFromToday(key);
  if (d < 0) return 'text-[#e5484d]';
  if (d === 0) return 'text-accent';
  if (d === 1) return 'text-[#d9860b] dark:text-[#eba23a]';
  return 'text-muted';
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

  const hasMeta = task.dueDate || (showCategory && category) || task.notes;

  return (
    <li
      ref={setRef}
      style={style}
      {...rowProps}
      className={cn(
        'group/row relative list-none rounded-xl no-callout',
        dragging ? 'z-10 bg-elevated shadow-float ring-1 ring-line' : 'bg-transparent',
      )}
      data-task-id={task.id}
    >
      {sortable && (
        <button
          ref={setHandleRef}
          type="button"
          {...handleProps}
          aria-label={`Reorder “${task.title}”`}
          className="absolute top-1/2 -left-7 hidden size-6 -translate-y-1/2 cursor-grab touch-none place-items-center rounded-md text-faint opacity-0 transition-opacity group-hover/row:opacity-100 hover:text-muted focus-visible:opacity-100 active:cursor-grabbing md:grid"
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150',
          !dragging && 'hover:bg-hover',
        )}
      >
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
              'block text-[14.5px] leading-[1.35rem] break-words transition-colors duration-200',
              checked ? 'text-faint line-through decoration-faint/70' : 'text-fg',
            )}
          >
            <Highlight text={task.title} query={query} />
          </span>
          {hasMeta && (
            <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] leading-5 text-muted">
              {task.dueDate && (
                <span className={cn('inline-flex items-center gap-1', dueTone(task.dueDate, checked))}>
                  <CalendarDays className="size-3" />
                  {formatDue(task.dueDate)}
                </span>
              )}
              {showCategory && category && (
                <span className="inline-flex items-center gap-1.5">
                  <CategoryDot category={category} className="size-[7px]" />
                  {category.name}
                </span>
              )}
              {task.notes && (
                <span className="inline-flex min-w-0 items-center gap-1 text-faint">
                  <NotebookText className="size-3 shrink-0" />
                  <span className="max-w-[16rem] truncate">
                    <Highlight text={task.notes.split('\n')[0]} query={query} />
                  </span>
                </span>
              )}
            </span>
          )}
        </button>
      </div>
    </li>
  );
});
