export type Priority = 0 | 1 | 2 | 3; // none, low, medium, high

export interface Task {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  completedAt: number | null;
  priority: Priority;
  /** Local calendar date, `YYYY-MM-DD`. */
  dueDate: string | null;
  categoryId: string | null;
  /** Heading the task is grouped under inside its list (e.g. "Planning"). `null` = ungrouped. */
  section: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
}

export type CategoryColor = 'slate' | 'red' | 'orange' | 'amber' | 'green' | 'teal' | 'blue' | 'indigo' | 'violet' | 'pink';

export type Theme = 'light' | 'dark' | 'system';
export type Accent = 'indigo' | 'blue' | 'teal' | 'green' | 'amber' | 'rose' | 'graphite';
export type Filter = 'all' | 'active' | 'today' | 'completed';
/** `null` = every list. */
export type Scope = string | null;

export interface Preferences {
  theme: Theme;
  accent: Accent;
  name: string;
  newTaskPosition: 'top' | 'bottom';
  showCompletedInAll: boolean;
  completedOpen: boolean;
  lastFilter: Filter;
  lastScope: Scope;
}

export interface AppData {
  /** Array order is the user's manual ordering. */
  tasks: Task[];
  categories: Category[];
}

export interface BackupFile extends AppData {
  app: 'taskly';
  version: number;
  exportedAt: string;
  preferences?: Partial<Preferences>;
}

export const PRIORITY_LABEL: Record<Priority, string> = { 0: 'None', 1: 'Low', 2: 'Medium', 3: 'High' };
