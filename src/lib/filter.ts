import type { Filter, Scope, Task } from '../store/types';
import { todayKey } from './date';

export interface View {
  active: Task[];
  completed: Task[];
  /** Whether manual drag-and-drop ordering makes sense for the current view. */
  sortable: boolean;
}

const isToday = (ts: number | null) => !!ts && new Date(ts).toDateString() === new Date().toDateString();
const byCompletedDesc = (a: Task, b: Task) => (b.completedAt ?? 0) - (a.completedAt ?? 0);

export function matchesQuery(t: Task, q: string) {
  return t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q);
}

export function selectView(tasks: Task[], opts: { scope: Scope; filter: Filter; query: string; showCompleted: boolean }): View {
  const q = opts.query.trim().toLowerCase();
  if (q) {
    // Search is global so you never have to remember which list something lives in.
    const hits = tasks.filter((t) => matchesQuery(t, q));
    return { active: hits.filter((t) => !t.completed), completed: hits.filter((t) => t.completed).sort(byCompletedDesc), sortable: false };
  }

  const scoped = opts.scope ? tasks.filter((t) => t.categoryId === opts.scope) : tasks;
  const today = todayKey();

  switch (opts.filter) {
    case 'all':
      return {
        active: scoped.filter((t) => !t.completed),
        completed: opts.showCompleted ? scoped.filter((t) => t.completed).sort(byCompletedDesc) : [],
        sortable: true,
      };
    case 'active':
      return { active: scoped.filter((t) => !t.completed), completed: [], sortable: true };
    case 'today':
      return {
        active: scoped.filter((t) => !t.completed && !!t.dueDate && t.dueDate <= today),
        completed: scoped.filter((t) => t.completed && (t.dueDate === today || isToday(t.completedAt))).sort(byCompletedDesc),
        sortable: true,
      };
    case 'completed':
      return { active: [], completed: scoped.filter((t) => t.completed).sort(byCompletedDesc), sortable: false };
  }
}

export function todayStats(tasks: Task[]) {
  const today = todayKey();
  let open = 0;
  let overdue = 0;
  let done = 0;
  for (const t of tasks) {
    if (!t.completed && t.dueDate && t.dueDate <= today) {
      open++;
      if (t.dueDate < today) overdue++;
    } else if (t.completed && (t.dueDate === today || isToday(t.completedAt))) done++;
  }
  return { open, overdue, done, total: open + done };
}
