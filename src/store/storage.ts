import type { AppData, BackupFile, Category, Preferences, Task } from './types';
import { uid } from '../lib/id';

export const DATA_KEY = 'taskly:data';
export const PREFS_KEY = 'taskly:prefs';
export const SCHEMA_VERSION = 1;

export const DEFAULT_PREFS: Preferences = {
  theme: 'system',
  accent: 'indigo',
  name: '',
  avatar: null,
  newTaskPosition: 'top',
  showCompletedInAll: true,
  completedOpen: true,
  lastFilter: 'all',
  lastScope: null,
};

export function defaultCategories(): Category[] {
  return [
    { id: uid(), name: 'Personal', color: 'blue' },
    { id: uid(), name: 'Work', color: 'violet' },
    { id: uid(), name: 'Shopping', color: 'amber' },
  ];
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[taskly] could not save to localStorage', err);
  }
}

export function loadData(): AppData {
  const saved = read<{ version: number } & AppData>(DATA_KEY);
  if (saved && Array.isArray(saved.tasks) && Array.isArray(saved.categories)) {
    return { tasks: saved.tasks.map(normalizeTask).filter(isPresent), categories: saved.categories.filter(isCategory) };
  }
  return { tasks: [], categories: defaultCategories() };
}

export const saveData = (data: AppData) => write(DATA_KEY, { version: SCHEMA_VERSION, ...data });

export function loadPrefs(): Preferences {
  return { ...DEFAULT_PREFS, ...(read<Partial<Preferences>>(PREFS_KEY) ?? {}) };
}

export const savePrefs = (prefs: Preferences) => write(PREFS_KEY, prefs);

/* ---------- validation for imports & legacy data ---------- */

const isPresent = <T,>(v: T | null): v is T => v !== null;

function isCategory(c: unknown): c is Category {
  return !!c && typeof c === 'object' && typeof (c as Category).id === 'string' && typeof (c as Category).name === 'string';
}

function normalizeTask(t: unknown): Task | null {
  if (!t || typeof t !== 'object') return null;
  const o = t as Partial<Task>;
  if (typeof o.title !== 'string') return null;
  const now = Date.now();
  const priority = [0, 1, 2, 3].includes(o.priority as number) ? (o.priority as Task['priority']) : 0;
  return {
    id: typeof o.id === 'string' && o.id ? o.id : uid(),
    title: o.title,
    notes: typeof o.notes === 'string' ? o.notes : '',
    completed: !!o.completed,
    completedAt: o.completed ? (typeof o.completedAt === 'number' ? o.completedAt : now) : null,
    priority,
    dueDate: typeof o.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.dueDate) ? o.dueDate : null,
    categoryId: typeof o.categoryId === 'string' ? o.categoryId : null,
    section: typeof o.section === 'string' && o.section.trim() ? o.section.trim() : null,
    createdAt: typeof o.createdAt === 'number' ? o.createdAt : now,
    updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : now,
  };
}

export function parseBackup(text: string): BackupFile {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t valid JSON.');
  }
  const o = json as Partial<BackupFile>;
  if (!o || typeof o !== 'object' || !Array.isArray(o.tasks)) {
    throw new Error('That file doesn’t look like a Taskly backup.');
  }
  const categories = Array.isArray(o.categories) ? o.categories.filter(isCategory) : [];
  const catIds = new Set(categories.map((c) => c.id));
  const tasks = o.tasks
    .map(normalizeTask)
    .filter(isPresent)
    .map((t) => (t.categoryId && !catIds.has(t.categoryId) ? { ...t, categoryId: null } : t));
  return {
    app: 'taskly',
    version: typeof o.version === 'number' ? o.version : SCHEMA_VERSION,
    exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : new Date().toISOString(),
    tasks,
    categories,
    preferences: o.preferences && typeof o.preferences === 'object' ? o.preferences : undefined,
  };
}

export function buildBackup(data: AppData, prefs: Preferences): BackupFile {
  return {
    app: 'taskly',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tasks: data.tasks,
    categories: data.categories,
    preferences: prefs,
  };
}
