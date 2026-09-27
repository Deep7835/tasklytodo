import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { AppData, Category, CategoryColor, Preferences, Task } from './types';
import { DATA_KEY, PREFS_KEY, defaultCategories, loadData, loadPrefs, saveData, savePrefs } from './storage';
import { uid } from '../lib/id';

type Action =
  | { type: 'hydrate'; data: AppData }
  | { type: 'addTask'; task: Task; position: 'top' | 'bottom' }
  | { type: 'updateTask'; id: string; patch: Partial<Task> }
  | { type: 'toggleTask'; id: string }
  | { type: 'deleteTask'; id: string }
  | { type: 'restoreTask'; task: Task; index: number }
  | { type: 'reorder'; activeId: string; overId: string }
  | { type: 'clearCompleted' }
  | { type: 'addCategory'; category: Category }
  | { type: 'updateCategory'; id: string; patch: Partial<Category> }
  | { type: 'deleteCategory'; id: string };

function reducer(state: AppData, action: Action): AppData {
  const now = Date.now();
  switch (action.type) {
    case 'hydrate':
      return action.data;
    case 'addTask':
      return {
        ...state,
        tasks: action.position === 'top' ? [action.task, ...state.tasks] : [...state.tasks, action.task],
      };
    case 'updateTask':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch, updatedAt: now } : t)),
      };
    case 'toggleTask':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, completed: !t.completed, completedAt: t.completed ? null : now, updatedAt: now } : t,
        ),
      };
    case 'deleteTask':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case 'restoreTask': {
      const tasks = state.tasks.filter((t) => t.id !== action.task.id);
      tasks.splice(Math.min(action.index, tasks.length), 0, action.task);
      return { ...state, tasks };
    }
    case 'reorder': {
      const from = state.tasks.findIndex((t) => t.id === action.activeId);
      const to = state.tasks.findIndex((t) => t.id === action.overId);
      if (from < 0 || to < 0 || from === to) return state;
      const tasks = state.tasks.slice();
      const [moved] = tasks.splice(from, 1);
      tasks.splice(to, 0, moved);
      return { ...state, tasks };
    }
    case 'clearCompleted':
      return { ...state, tasks: state.tasks.filter((t) => !t.completed) };
    case 'addCategory':
      return { ...state, categories: [...state.categories, action.category] };
    case 'updateCategory':
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      };
    case 'deleteCategory':
      return {
        categories: state.categories.filter((c) => c.id !== action.id),
        tasks: state.tasks.map((t) => (t.categoryId === action.id ? { ...t, categoryId: null } : t)),
      };
  }
}

export type NewTask = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> & { title: string };

function useStoreValue() {
  const [data, dispatch] = useReducer(reducer, undefined, loadData);
  const [prefs, setPrefsState] = useState<Preferences>(loadPrefs);

  // Persist on every change. localStorage writes are cheap at to-do-list scale.
  const skipSave = useRef(false);
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saveData(data);
  }, [data]);
  useEffect(() => savePrefs(prefs), [prefs]);

  // Keep multiple open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DATA_KEY) {
        skipSave.current = true;
        dispatch({ type: 'hydrate', data: loadData() });
      } else if (e.key === PREFS_KEY) {
        setPrefsState(loadPrefs());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPrefs = useCallback((patch: Partial<Preferences>) => setPrefsState((p) => ({ ...p, ...patch })), []);

  const dataRef = useRef(data);
  dataRef.current = data;
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const actions = useMemo(
    () => ({
      addTask(input: NewTask): Task {
        const now = Date.now();
        const task: Task = {
          notes: '',
          completed: false,
          completedAt: null,
          priority: 0,
          dueDate: null,
          categoryId: null,
          ...input,
          id: uid(),
          createdAt: now,
          updatedAt: now,
        };
        dispatch({ type: 'addTask', task, position: prefsRef.current.newTaskPosition });
        return task;
      },
      updateTask: (id: string, patch: Partial<Task>) => dispatch({ type: 'updateTask', id, patch }),
      toggleTask: (id: string) => dispatch({ type: 'toggleTask', id }),
      /** Deletes a task and returns a function that undoes the deletion. */
      deleteTask(id: string): () => void {
        const index = dataRef.current.tasks.findIndex((t) => t.id === id);
        const task = dataRef.current.tasks[index];
        dispatch({ type: 'deleteTask', id });
        return () => task && dispatch({ type: 'restoreTask', task, index });
      },
      reorder: (activeId: string, overId: string) => dispatch({ type: 'reorder', activeId, overId }),
      clearCompleted(): () => void {
        const snapshot = dataRef.current;
        dispatch({ type: 'clearCompleted' });
        return () => dispatch({ type: 'hydrate', data: { ...dataRef.current, tasks: snapshot.tasks } });
      },
      addCategory(name: string, color: CategoryColor): Category {
        const category = { id: uid(), name: name.trim(), color };
        dispatch({ type: 'addCategory', category });
        return category;
      },
      updateCategory: (id: string, patch: Partial<Category>) => dispatch({ type: 'updateCategory', id, patch }),
      deleteCategory: (id: string) => dispatch({ type: 'deleteCategory', id }),
      replaceData: (next: AppData) => dispatch({ type: 'hydrate', data: next }),
      mergeData(incoming: AppData): number {
        const cur = dataRef.current;
        const catIds = new Set(cur.categories.map((c) => c.id));
        const byName = new Map(cur.categories.map((c) => [c.name.toLowerCase(), c.id]));
        const remap = new Map<string, string>();
        const newCats: Category[] = [];
        for (const c of incoming.categories) {
          if (catIds.has(c.id)) continue;
          const existing = byName.get(c.name.toLowerCase());
          if (existing) remap.set(c.id, existing);
          else newCats.push(c);
        }
        const taskIds = new Set(cur.tasks.map((t) => t.id));
        const newTasks = incoming.tasks
          .filter((t) => !taskIds.has(t.id))
          .map((t) => (t.categoryId && remap.has(t.categoryId) ? { ...t, categoryId: remap.get(t.categoryId)! } : t));
        dispatch({ type: 'hydrate', data: { categories: [...cur.categories, ...newCats], tasks: [...cur.tasks, ...newTasks] } });
        return newTasks.length;
      },
      resetAll() {
        dispatch({ type: 'hydrate', data: { tasks: [], categories: defaultCategories() } });
      },
    }),
    [],
  );

  return { data, prefs, setPrefs, ...actions };
}

type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
