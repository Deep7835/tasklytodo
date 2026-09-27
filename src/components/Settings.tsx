import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Download, Laptop, Moon, Plus, PlusSquare, Share, Sun, Trash2, Upload, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { Modal } from './Modal';
import { Popover } from './Popover';
import { btn, type ConfirmOptions } from './Confirm';
import { useToast } from './Toast';
import { ACCENTS, CATEGORY_COLORS, cn, nextListColor } from '../lib/ui';
import { todayKey } from '../lib/date';
import { useStore } from '../store/store';
import { buildBackup, parseBackup } from '../store/storage';
import type { CategoryColor, Theme } from '../store/types';
import { isIOS, isStandalone, useInstallPrompt, useOnline } from '../lib/pwa';

interface Props {
  open: boolean;
  onClose: () => void;
  confirm: (o: ConfirmOptions) => void;
}

export function Settings({ open, onClose, confirm }: Props) {
  const store = useStore();
  const { prefs, setPrefs, data } = store;
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const install = useInstallPrompt();
  const online = useOnline();

  const exportJson = () => {
    const backup = buildBackup(data, prefs);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskly-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Exported ${data.tasks.length} task${data.tasks.length === 1 ? '' : 's'}`);
  };

  const importFile = async (file: File) => {
    try {
      const backup = parseBackup(await file.text());
      const n = backup.tasks.length;
      confirm({
        title: 'Import backup',
        message: `This file contains ${n} task${n === 1 ? '' : 's'} and ${backup.categories.length} list${backup.categories.length === 1 ? '' : 's'}. Merge it with your current tasks, or replace everything?`,
        actions: [
          {
            label: 'Replace all',
            tone: 'danger',
            onClick: () => {
              store.replaceData({ tasks: backup.tasks, categories: backup.categories });
              setPrefs({ lastScope: null });
              toast(`Restored ${n} task${n === 1 ? '' : 's'}`);
            },
          },
          {
            label: 'Merge',
            tone: 'primary',
            onClick: () => {
              const added = store.mergeData(backup);
              toast(added ? `Imported ${added} new task${added === 1 ? '' : 's'}` : 'Nothing new to import');
            },
          },
        ],
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Import failed', { tone: 'error' });
    }
  };

  const completedCount = data.tasks.filter((t) => t.completed).length;

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-7 px-5 pt-2 pb-6">
        <Section title="Appearance">
          <Row label="Theme">
            <Segmented<Theme>
              value={prefs.theme}
              onChange={(theme) => setPrefs({ theme })}
              options={[
                { value: 'light', label: 'Light', icon: <Sun className="size-3.5" /> },
                { value: 'dark', label: 'Dark', icon: <Moon className="size-3.5" /> },
                { value: 'system', label: 'System', icon: <Laptop className="size-3.5" /> },
              ]}
            />
          </Row>
          <Row label="Accent">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent color">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={prefs.accent === a.id}
                  aria-label={a.label}
                  title={a.label}
                  onClick={() => setPrefs({ accent: a.id })}
                  className={cn(
                    'grid size-7 place-items-center rounded-full border border-black/10 ring-offset-2 ring-offset-elevated transition-transform hover:scale-110 dark:border-white/20',
                    prefs.accent === a.id && 'ring-2 ring-line-strong',
                  )}
                  style={{ backgroundColor: a.swatch }}
                >
                  {prefs.accent === a.id && <Check className="size-3.5 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title="Preferences">
          <Row label="Your name" hint="Used in the greeting">
            <input
              value={prefs.name}
              onChange={(e) => setPrefs({ name: e.target.value })}
              placeholder="Optional"
              maxLength={40}
              className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-[14px] outline-none transition-colors placeholder:text-faint focus:border-accent sm:w-48"
            />
          </Row>
          <Row label="Add new tasks to">
            <Segmented
              value={prefs.newTaskPosition}
              onChange={(newTaskPosition) => setPrefs({ newTaskPosition })}
              options={[
                { value: 'top', label: 'Top' },
                { value: 'bottom', label: 'Bottom' },
              ]}
            />
          </Row>
          <Row label="Show completed in “All”">
            <Switch checked={prefs.showCompletedInAll} onChange={(v) => setPrefs({ showCompletedInAll: v })} label="Show completed tasks in All" />
          </Row>
        </Section>

        <Section title="Lists">
          <ListManager confirm={confirm} />
        </Section>

        <Section title="Backup & data">
          <p className="-mt-1 text-[13px] leading-relaxed text-muted">
            Your tasks are stored only on this device. Export a backup to move them or keep them safe.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={exportJson} className={btn('default')}>
              <Download className="size-4" /> Export JSON
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={btn('default')}>
              <Upload className="size-4" /> Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importFile(f);
                e.target.value = '';
              }}
            />
          </div>
          <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
            <DangerRow
              label="Clear completed tasks"
              detail={`${completedCount} completed`}
              disabled={!completedCount}
              onClick={() =>
                confirm({
                  title: 'Clear completed tasks?',
                  message: `This removes ${completedCount} completed task${completedCount === 1 ? '' : 's'}.`,
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
            />
            <DangerRow
              label="Erase all data"
              detail="Tasks and lists"
              onClick={() =>
                confirm({
                  title: 'Erase everything?',
                  message: 'All tasks and lists on this device will be permanently deleted. Consider exporting a backup first.',
                  actions: [
                    {
                      label: 'Erase',
                      tone: 'danger',
                      onClick: () => {
                        store.resetAll();
                        setPrefs({ lastScope: null, lastFilter: 'all' });
                        toast('All data erased');
                      },
                    },
                  ],
                })
              }
            />
          </div>
        </Section>

        <Section title="App">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3">
            <div className="flex items-center gap-3">
              <span className={cn('grid size-8 place-items-center rounded-lg', online ? 'bg-[#30a46c]/12 text-[#30a46c]' : 'bg-hover text-muted')}>
                {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
              </span>
              <div>
                <p className="text-[13.5px] font-medium">{online ? 'Online' : 'Offline'}</p>
                <p className="text-[12.5px] text-muted">Taskly works fully offline.</p>
              </div>
            </div>
            {install.available && (
              <button type="button" onClick={install.prompt} className={btn('primary')}>
                <Smartphone className="size-4" /> Install
              </button>
            )}
          </div>
          <AddToHomeScreen />
          <div className="hidden text-[12.5px] leading-6 text-muted md:block">
            <p className="mb-1 font-medium text-fg">Keyboard shortcuts</p>
            <Shortcut keys={['N']} label="New task" />
            <Shortcut keys={['/']} label="Search" />
            <Shortcut keys={['Esc']} label="Close / clear" />
          </div>
          <p className="text-[12px] text-faint">Taskly v1.0 · Made to stay out of your way.</p>
        </Section>
      </div>
    </Modal>
  );
}

function ListManager({ confirm }: { confirm: (o: ConfirmOptions) => void }) {
  const { data, addCategory, updateCategory, deleteCategory, prefs, setPrefs } = useStore();
  const toast = useToast();
  const [name, setName] = useState('');
  const colors = Object.keys(CATEGORY_COLORS) as CategoryColor[];

  const add = () => {
    const n = name.trim();
    if (!n) return;
    addCategory(n, nextListColor(data.categories));
    setName('');
  };

  return (
    <div className="flex flex-col gap-1.5">
      {data.categories.map((c) => {
        const count = data.tasks.filter((t) => t.categoryId === c.id).length;
        return (
          <div key={c.id} className="group flex items-center gap-2 rounded-xl border border-line bg-surface py-1 pr-1 pl-2">
            <Popover
              trigger={({ toggle }) => (
                <button type="button" onClick={toggle} className="grid size-8 place-items-center rounded-lg hover:bg-hover" aria-label={`Color for ${c.name}`}>
                  <span className="size-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.color] }} />
                </button>
              )}
            >
              {(close) => (
                <div className="grid grid-cols-5 gap-1 p-1.5">
                  {colors.map((col) => (
                    <button
                      key={col}
                      type="button"
                      aria-label={col}
                      onClick={() => {
                        updateCategory(c.id, { color: col });
                        close();
                      }}
                      className="grid size-8 place-items-center rounded-lg hover:bg-hover"
                    >
                      <span
                        className={cn('size-4 rounded-full', c.color === col && 'ring-2 ring-offset-2 ring-offset-elevated')}
                        style={{ backgroundColor: CATEGORY_COLORS[col], ['--tw-ring-color' as string]: CATEGORY_COLORS[col] }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </Popover>
            <InlineName value={c.name} onCommit={(v) => updateCategory(c.id, { name: v })} />
            <span className="text-[12px] text-faint tabular-nums">{count}</span>
            <button
              type="button"
              aria-label={`Delete ${c.name}`}
              onClick={() =>
                confirm({
                  title: `Delete “${c.name}”?`,
                  message: count
                    ? `The ${count} task${count === 1 ? '' : 's'} in this list will be kept and moved to “No list”.`
                    : 'This list is empty.',
                  actions: [
                    {
                      label: 'Delete list',
                      tone: 'danger',
                      onClick: () => {
                        deleteCategory(c.id);
                        if (prefs.lastScope === c.id) setPrefs({ lastScope: null });
                        toast(`Deleted “${c.name}”`);
                      },
                    },
                  ],
                })
              }
              className="grid size-8 place-items-center rounded-lg text-faint transition-colors hover:bg-[#e5484d]/10 hover:text-[#e5484d]"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        );
      })}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex items-center gap-2 rounded-xl border border-dashed border-line-strong py-1 pr-1 pl-2"
      >
        <span className="grid size-8 place-items-center text-faint">
          <Plus className="size-4" />
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New list"
          maxLength={32}
          aria-label="New list name"
          className="h-8 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
        />
        {name.trim() && (
          <button type="submit" className="h-8 rounded-lg bg-accent px-3 text-[13px] font-semibold text-accent-fg">
            Add
          </button>
        )}
      </form>
    </div>
  );
}

/** iOS has no install prompt, so explain the Share → Add to Home Screen flow there. */
function AddToHomeScreen() {
  if (isStandalone()) {
    return (
      <p className="flex items-center gap-2 text-[12.5px] text-muted">
        <Check className="size-3.5 text-[#30a46c]" /> Running from your home screen
      </p>
    );
  }
  if (!isIOS()) return null;
  const step = (n: number, body: ReactNode) => (
    <li className="flex items-center gap-3">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">{n}</span>
      <span className="flex flex-wrap items-center gap-1">{body}</span>
    </li>
  );
  return (
    <div className="rounded-xl border border-line px-3.5 py-3">
      <p className="text-[13.5px] font-medium">Add Taskly to your Home Screen</p>
      <p className="mt-0.5 text-[12.5px] text-muted">It opens full-screen like an app and works offline.</p>
      <ol className="mt-3 flex flex-col gap-2 text-[13px]">
        {step(1, <>Tap <Share className="mx-0.5 size-4 text-accent" aria-label="Share" /> in Safari’s toolbar</>)}
        {step(2, <>Choose <PlusSquare className="mx-0.5 size-4" aria-hidden /> <strong className="font-medium">Add to Home Screen</strong></>)}
        {step(3, <>Tap <strong className="font-medium">Add</strong></>)}
      </ol>
    </div>
  );
}

function InlineName({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    const v = draft.trim();
    if (v && v !== value) onCommit(v);
    else setDraft(value);
  };
  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      maxLength={32}
      aria-label="List name"
      className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-1 text-[14px] outline-none focus:bg-hover"
    />
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[11.5px] font-semibold tracking-[0.06em] text-faint uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[14px] font-medium">{label}</p>
        {hint && <p className="text-[12.5px] text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function DangerRow({ label, detail, onClick, disabled }: { label: string; detail: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-between px-3.5 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-hover disabled:opacity-50 disabled:hover:bg-transparent"
    >
      <span className="text-[13.5px] font-medium text-[#e5484d]">{label}</span>
      <span className="text-[12.5px] text-faint">{detail}</span>
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode }[];
}) {
  return (
    <div role="radiogroup" className="inline-flex rounded-xl bg-hover p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-all',
            value === o.value ? 'bg-elevated text-fg shadow-soft' : 'text-muted hover:text-fg',
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-line-strong')}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out-soft',
          checked && 'translate-x-4',
        )}
      />
    </button>
  );
}

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="flex gap-1">
        {keys.map((k) => (
          <kbd key={k} className="rounded-md border border-line bg-surface px-1.5 font-sans text-[11px] text-muted">
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}
