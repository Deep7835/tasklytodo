import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CalendarDays, Hash, Inbox, Trash2, X } from 'lucide-react';
import { Modal } from './Modal';
import { Checkbox } from './Checkbox';
import { CategoryDot, PriorityFlag } from './pickers';
import { addDays, fromKey, isOverdue, nextWeekday, todayKey } from '../lib/date';
import { cn } from '../lib/ui';
import { useStore } from '../store/store';
import type { Priority, Task } from '../store/types';
import { PRIORITY_LABEL } from '../store/types';

function useAutosize(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}

interface Props {
  taskId: string | null;
  onClose: () => void;
  onDelete: (task: Task) => void;
}

export function TaskDetail({ taskId, onClose, onDelete }: Props) {
  const { data } = useStore();
  const live = data.tasks.find((t) => t.id === taskId) ?? null;
  // Keep rendering the last task while the panel animates closed.
  const lastRef = useRef<Task | null>(null);
  if (live) lastRef.current = live;
  const task = live ?? lastRef.current;

  return (
    <Modal open={!!live} onClose={onClose} title="Task details" variant="drawer" hideHeader>
      {task && <DetailBody key={task.id} task={task} onClose={onClose} onDelete={onDelete} />}
    </Modal>
  );
}

function DetailBody({ task, onClose, onDelete }: { task: Task; onClose: () => void; onDelete: (task: Task) => void }) {
  const { data, updateTask, toggleTask } = useStore();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  useAutosize(titleRef, title);
  useAutosize(notesRef, notes);

  // Sync if the task is changed elsewhere (e.g. another tab).
  useEffect(() => setTitle(task.title), [task.title]);
  useEffect(() => setNotes(task.notes), [task.notes]);

  const commitTitle = () => {
    const trimmed = title.trim();
    if (!trimmed) setTitle(task.title);
    else if (trimmed !== task.title) updateTask(task.id, { title: trimmed });
  };

  const set = (patch: Partial<Task>) => updateTask(task.id, patch);
  const today = todayKey();

  const quickDates: { label: string; value: string }[] = [
    { label: 'Today', value: today },
    { label: 'Tomorrow', value: addDays(today, 1) },
    { label: 'Next week', value: nextWeekday(1) },
  ];

  const pill = (active: boolean) =>
    cn(
      'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-medium transition-colors',
      active ? 'border-transparent bg-accent-soft text-accent' : 'border-line text-muted hover:bg-hover hover:text-fg',
    );

  return (
    <div className="flex h-full min-h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-3 pb-1 md:pt-4">
        <span className="text-[12px] font-medium tracking-wide text-faint uppercase">
          {task.completed ? 'Completed' : 'Task'}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="-mr-2 grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-fg"
          aria-label="Close details"
        >
          <X className="size-[18px]" />
        </button>
      </div>

      <div className="flex items-start gap-3 px-5 pt-1">
        <div className="pt-[5px]">
          <Checkbox checked={task.completed} priority={task.priority} onChange={() => toggleTask(task.id)} label="Toggle complete" size="lg" />
        </div>
        <textarea
          ref={titleRef}
          value={title}
          rows={1}
          onChange={(e) => {
            const next = e.target.value.replace(/\n/g, ' ');
            setTitle(next);
            // Save as you type; an emptied title is reverted on blur instead.
            if (next.trim()) set({ title: next });
          }}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          aria-label="Task title"
          data-keep-size
          className={cn(
            'w-full resize-none overflow-hidden bg-transparent text-[19px] leading-[1.4] font-semibold tracking-[-0.015em] outline-none placeholder:text-faint',
            task.completed && 'text-muted line-through decoration-faint',
          )}
          placeholder="Task title"
        />
      </div>

      <div className="px-5 pt-2 pl-[52px]">
        <textarea
          ref={notesRef}
          value={notes}
          rows={2}
          onChange={(e) => {
            setNotes(e.target.value);
            set({ notes: e.target.value });
          }}
          placeholder="Add notes…"
          aria-label="Notes"
          className="min-h-[3rem] w-full resize-none overflow-hidden bg-transparent text-[14px] leading-relaxed text-fg outline-none placeholder:text-faint"
        />
      </div>

      <div className="mx-5 mt-3 flex flex-col gap-5 border-t border-line pt-5 pb-6">
        <Field label="Due date" icon={<CalendarDays className="size-3.5" />}>
          <div className="flex flex-wrap items-center gap-1.5">
            {quickDates.map((q) => (
              <button key={q.label} type="button" onClick={() => set({ dueDate: q.value })} className={pill(task.dueDate === q.value)}>
                {q.label}
              </button>
            ))}
            <label className={cn(pill(!!task.dueDate && !quickDates.some((q) => q.value === task.dueDate)), 'relative cursor-pointer')}>
              <input
                type="date"
                value={task.dueDate ?? ''}
                onChange={(e) => set({ dueDate: e.target.value || null })}
                className="w-[8.5rem] bg-transparent text-[13px] outline-none"
                aria-label="Pick a due date"
              />
            </label>
            {task.dueDate && (
              <button
                type="button"
                onClick={() => set({ dueDate: null })}
                className="grid size-8 place-items-center rounded-lg text-faint transition-colors hover:bg-hover hover:text-fg"
                aria-label="Clear due date"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {task.dueDate && (
            <p className={cn('mt-1.5 text-[12.5px]', isOverdue(task.dueDate) && !task.completed ? 'text-[#e5484d]' : 'text-muted')}>
              {isOverdue(task.dueDate) && !task.completed && 'Overdue · '}
              {fromKey(task.dueDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </Field>

        <Field label="Priority" icon={<PriorityFlag priority={task.priority} />}>
          <div role="radiogroup" aria-label="Priority" className="grid grid-cols-4 gap-1 rounded-xl bg-hover p-1">
            {([0, 1, 2, 3] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={task.priority === p}
                onClick={() => set({ priority: p })}
                className={cn(
                  'flex h-8 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-all',
                  task.priority === p ? 'bg-elevated text-fg shadow-soft' : 'text-muted hover:text-fg',
                )}
              >
                {p > 0 && <PriorityFlag priority={p} className="size-3" />}
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="List" icon={<Hash className="size-3.5" />}>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => set({ categoryId: null })} className={pill(task.categoryId === null)}>
              <Inbox className="size-3.5" />
              None
            </button>
            {data.categories.map((c) => (
              <button key={c.id} type="button" onClick={() => set({ categoryId: c.id })} className={pill(task.categoryId === c.id)}>
                <CategoryDot category={c} />
                {c.name}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-5 py-3">
        <span className="text-[12px] text-faint">
          Created {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          {task.completedAt && ` · Done ${new Date(task.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
        </span>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-[#e5484d] transition-colors hover:bg-[#e5484d]/10"
        >
          <Trash2 className="size-4" />
          Delete
        </button>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-muted">
        <span className="text-faint">{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}
