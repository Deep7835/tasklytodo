import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Check,
  ChevronRight,
  ColorSwatch,
  Danger,
  DocumentDownload,
  Download,
  Edit2,
  Keyboard,
  Laptop,
  Layers,
  Mobile,
  Moon,
  Plus,
  PlusSquare,
  Setting4,
  Share,
  Sun,
  Trash2,
  Upload,
  User,
  Wifi,
  WifiOff,
} from 'reicon-react';
import { Avatar, AvatarImage } from './Avatar';
import { Modal } from './Modal';
import { Popover } from './Popover';
import { btn, type ConfirmOptions } from './Confirm';
import { useToast } from './Toast';
import { ACCENTS, CATEGORY_COLORS, cn, nextListColor } from '../lib/ui';
import { AVATARS, findAvatar } from '../lib/avatars';
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

const DANGER = '#e5484d';

export function Settings({ open, onClose, confirm }: Props) {
  const store = useStore();
  const { prefs, setPrefs, data } = store;
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const install = useInstallPrompt();
  const online = useOnline();
  const [pickingAvatar, setPickingAvatar] = useState(false);

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
  const name = prefs.name.trim();
  const accentLabel = ACCENTS.find((a) => a.id === prefs.accent)?.label;

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      {/* Grouped cards on a quiet background, like iOS settings. */}
      <div className="flex flex-col gap-6 bg-sidebar px-4 pt-4 pb-6 sm:px-5">
        {/* Profile */}
        <div className="rounded-2xl border border-line bg-elevated p-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPickingAvatar((v) => !v)}
              aria-label="Change avatar"
              aria-expanded={pickingAvatar}
              className="relative shrink-0 rounded-full transition-transform duration-150 ease-out active:scale-95"
            >
              <Avatar className="size-16" textClass="text-[24px]" />
              <span className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full border border-line bg-elevated text-muted shadow-soft">
                <Edit2 className="size-3" />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <input
                value={prefs.name}
                onChange={(e) => setPrefs({ name: e.target.value })}
                placeholder="Add your name"
                maxLength={40}
                aria-label="Your name"
                className="-mx-1.5 h-8 w-[calc(100%+0.75rem)] rounded-lg bg-transparent px-1.5 text-[17px] font-medium tracking-[-0.01em] outline-none transition-colors placeholder:text-faint hover:bg-hover focus:bg-hover"
              />
              <p className="mt-0.5 text-[12.5px] text-muted tabular-nums">
                {data.tasks.length} tasks · {data.categories.length} lists · {completedCount} done
              </p>
              <button
                type="button"
                onClick={() => setPickingAvatar((v) => !v)}
                className="mt-1 text-[12.5px] font-medium text-accent underline-offset-4 hover:underline"
              >
                {pickingAvatar ? 'Done' : 'Change avatar'}
              </button>
            </div>
          </div>

          {pickingAvatar && (
            <div className="mt-4 animate-fade-in border-t border-line pt-4">
              <p className="mb-3 text-[12.5px] text-muted">Choose an avatar. It shows in the sidebar and app bar.</p>
              <div role="radiogroup" aria-label="Avatar" className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                <AvatarOption selected={!findAvatar(prefs.avatar)} label="Initial" onClick={() => setPrefs({ avatar: null })}>
                  <span className="btn-primary grid size-full place-items-center rounded-full text-[18px] font-medium">
                    {name ? name[0].toUpperCase() : <User className="size-5" />}
                  </span>
                </AvatarOption>
                {AVATARS.map((a) => (
                  <AvatarOption key={a.id} selected={prefs.avatar === a.id} label={a.label} onClick={() => setPrefs({ avatar: a.id })}>
                    <AvatarImage avatar={a} className="size-full" />
                  </AvatarOption>
                ))}
              </div>
            </div>
          )}
        </div>

        <Group icon={<ColorSwatch className="size-4" />} title="Appearance">
          <SettingRow label="Theme" stack>
            <ThemePicker value={prefs.theme} onChange={(theme) => setPrefs({ theme })} />
          </SettingRow>
          <SettingRow label="Accent color" hint={accentLabel}>
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
                    'grid size-7 place-items-center rounded-full border border-black/10 ring-offset-2 ring-offset-elevated transition-transform duration-150 ease-out active:scale-95 dark:border-white/20',
                    prefs.accent === a.id && 'ring-2 ring-line-strong',
                  )}
                  style={{ backgroundColor: a.swatch }}
                >
                  {prefs.accent === a.id && <Check className="size-3.5 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </SettingRow>
        </Group>

        <Group icon={<Setting4 className="size-4" />} title="Preferences">
          <SettingRow label="Add new tasks to" hint="Where quick-added tasks appear">
            <Segmented
              value={prefs.newTaskPosition}
              onChange={(newTaskPosition) => setPrefs({ newTaskPosition })}
              options={[
                { value: 'top', label: 'Top' },
                { value: 'bottom', label: 'Bottom' },
              ]}
            />
          </SettingRow>
          <SettingRow label="Show completed in “All”" hint="Keep finished tasks visible below the list">
            <Switch checked={prefs.showCompletedInAll} onChange={(v) => setPrefs({ showCompletedInAll: v })} label="Show completed tasks in All" />
          </SettingRow>
        </Group>

        <Group icon={<Layers className="size-4" />} title="Lists" description="Rename a list by clicking its name. Click the dot to change its color.">
          <ListManager confirm={confirm} />
        </Group>

        <Group icon={<DocumentDownload className="size-4" />} title="Backup" description="Your tasks are stored only on this device. Export a backup to move them or keep them safe.">
          <ActionRow icon={<Download className="size-[18px]" />} label="Export backup" hint="Save all tasks and lists as a JSON file" onClick={exportJson} />
          <ActionRow icon={<Upload className="size-[18px]" />} label="Import backup" hint="Merge or replace from a JSON file" onClick={() => fileRef.current?.click()} />
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
        </Group>

        <Group icon={<Danger className="size-4" />} title="Danger zone" tone="danger">
          <ActionRow
            danger
            icon={<Check className="size-[18px]" />}
            label="Clear completed tasks"
            hint={completedCount ? `${completedCount} completed task${completedCount === 1 ? '' : 's'}` : 'Nothing to clear'}
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
          <ActionRow
            danger
            icon={<Trash2 className="size-[18px]" />}
            label="Erase all data"
            hint="Permanently deletes every task and list on this device"
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
        </Group>

        <Group icon={<Mobile className="size-4" />} title="App">
          <SettingRow
            icon={
              <span className={cn('grid size-8 place-items-center rounded-full', online ? 'bg-[#30a46c]/12 text-[#30a46c]' : 'bg-hover text-muted')}>
                {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
              </span>
            }
            label={online ? 'Online' : 'Offline'}
            hint="Taskly works fully offline"
          >
            {install.available && (
              <button type="button" onClick={install.prompt} className={btn('primary')}>
                <Mobile className="size-4" /> Install
              </button>
            )}
          </SettingRow>
          <AddToHomeScreen />
        </Group>

        <div className="hidden md:block">
          <Group icon={<Keyboard className="size-4" />} title="Keyboard shortcuts">
            <Shortcut keys={['N']} label="New task" />
            <Shortcut keys={['/']} label="Search" />
            <Shortcut keys={['Esc']} label="Close or clear" />
          </Group>
        </div>

        <p className="text-center text-[12px] text-faint">Taskly v1.0 · Made to stay out of your way.</p>
      </div>
    </Modal>
  );
}

function AvatarOption({ selected, label, onClick, children }: { selected: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      onClick={onClick}
      className="group relative mx-auto aspect-square w-full max-w-14 rounded-full transition-transform duration-150 ease-out active:scale-95"
    >
      <span
        className={cn(
          'block size-full rounded-full ring-offset-2 ring-offset-elevated transition-shadow duration-150',
          selected ? 'ring-2 ring-accent' : 'ring-1 ring-line group-hover:ring-line-strong',
        )}
      >
        {children}
      </span>
      {selected && (
        <span className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-accent text-accent-fg ring-2 ring-elevated">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/** Three mini previews of the app in light, dark and system themes. */
function ThemePicker({ value, onChange }: { value: Theme; onChange: (t: Theme) => void }) {
  const options: { value: Theme; label: string; icon: ReactNode; preview: string }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="size-3.5" />, preview: '#fbfbfc' },
    { value: 'dark', label: 'Dark', icon: <Moon className="size-3.5" />, preview: '#141519' },
    { value: 'system', label: 'System', icon: <Laptop className="size-3.5" />, preview: 'linear-gradient(90deg, #fbfbfc 50%, #141519 50%)' },
  ];
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2.5">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className="group flex flex-col gap-2 text-left transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            <span
              className={cn(
                'relative block h-16 overflow-hidden rounded-xl border transition-[box-shadow,border-color] duration-150',
                selected ? 'border-transparent ring-2 ring-accent' : 'border-line group-hover:border-line-strong',
              )}
              style={{ background: o.preview }}
              aria-hidden
            >
              {/* A tiny mock of the task list. */}
              <span className="absolute top-2.5 left-2.5 flex w-[60%] flex-col gap-1.5">
                <span className="h-1.5 w-2/3 rounded-full bg-[var(--accent)] opacity-80" />
                <span className="h-1.5 rounded-full bg-[#8b8f9a]/35" />
                <span className="h-1.5 w-4/5 rounded-full bg-[#8b8f9a]/35" />
              </span>
            </span>
            <span className={cn('flex items-center gap-1.5 text-[13px] font-medium', selected ? 'text-fg' : 'text-muted')}>
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
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
    <>
      {data.categories.map((c) => {
        const count = data.tasks.filter((t) => t.categoryId === c.id).length;
        return (
          <div key={c.id} className="flex items-center gap-2 py-1.5 pr-2 pl-2.5">
            <Popover
              trigger={({ toggle }) => (
                <button type="button" onClick={toggle} className="grid size-8 place-items-center rounded-lg hover:bg-hover" aria-label={`Color for ${c.name}`}>
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[c.color], boxShadow: `0 0 0 3px color-mix(in oklab, ${CATEGORY_COLORS[c.color]} 18%, transparent)` }}
                  />
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
            <span className="rounded-full bg-hover px-2 py-0.5 text-[11.5px] font-medium text-muted tabular-nums">
              {count} {count === 1 ? 'task' : 'tasks'}
            </span>
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
                        const undo = deleteCategory(c.id);
                        if (prefs.lastScope === c.id) setPrefs({ lastScope: null });
                        toast(`Deleted “${c.name}”`, { action: { label: 'Undo', onClick: undo } });
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
        className="flex items-center gap-2 py-1.5 pr-2 pl-2.5"
      >
        <span className="grid size-8 place-items-center rounded-lg border border-dashed border-line-strong text-faint">
          <Plus className="size-4" />
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New list"
          maxLength={32}
          aria-label="New list name"
          className="h-8 min-w-0 flex-1 bg-transparent px-1 text-[14px] outline-none placeholder:text-faint"
        />
        {name.trim() && (
          <button type="submit" className="btn-primary h-8 rounded-[10px] px-3 text-[13px] font-medium">
            Add
          </button>
        )}
      </form>
    </>
  );
}

/** iOS has no install prompt, so explain the Share → Add to Home Screen flow there. */
function AddToHomeScreen() {
  if (isStandalone()) {
    return (
      <SettingRow
        icon={
          <span className="grid size-8 place-items-center rounded-full bg-[#30a46c]/12 text-[#30a46c]">
            <Check className="size-4" />
          </span>
        }
        label="Installed"
        hint="Running from your home screen"
      />
    );
  }
  if (!isIOS()) return null;
  const step = (n: number, body: ReactNode) => (
    <li className="flex items-center gap-3">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-medium text-accent">{n}</span>
      <span className="flex flex-wrap items-center gap-1">{body}</span>
    </li>
  );
  return (
    <div className="px-4 py-3.5">
      <p className="text-[14px] font-medium">Add Taskly to your Home Screen</p>
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
      className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-1 text-[14px] outline-none transition-colors hover:bg-hover focus:bg-hover"
    />
  );
}

/** A titled group of rows in one card. `danger` tints the border red. */
function Group({
  icon,
  title,
  description,
  tone,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  tone?: 'danger';
  children: ReactNode;
}) {
  return (
    <section>
      <header className="mb-2 px-1">
        <h3 className={cn('flex items-center gap-2 text-[13px] font-medium', tone === 'danger' ? 'text-[#e5484d]' : 'text-fg')}>
          <span className={tone === 'danger' ? '' : 'text-muted'}>{icon}</span>
          {title}
        </h3>
        {description && <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{description}</p>}
      </header>
      <div
        className={cn(
          'flex flex-col divide-y overflow-hidden rounded-2xl border bg-elevated',
          tone === 'danger' ? 'border-[#e5484d]/25 divide-[#e5484d]/15' : 'divide-line border-line',
        )}
      >
        {children}
      </div>
    </section>
  );
}

function SettingRow({ icon, label, hint, stack, children }: { icon?: ReactNode; label: string; hint?: string; stack?: boolean; children?: ReactNode }) {
  return (
    <div className={cn('flex gap-3 px-4 py-3.5', stack ? 'flex-col' : 'flex-wrap items-center justify-between')}>
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="text-[14px] font-medium">{label}</p>
          {hint && <p className="mt-0.5 text-[12.5px] text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

/** Full-width tappable row with an icon, label, hint and a chevron. */
function ActionRow({
  icon,
  label,
  hint,
  onClick,
  danger,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-hover disabled:opacity-50 disabled:hover:bg-transparent"
    >
      <span
        className={cn('grid size-8 shrink-0 place-items-center rounded-full', !danger && 'bg-hover text-fg/80')}
        style={danger ? { color: DANGER, backgroundColor: `color-mix(in oklab, ${DANGER} 11%, transparent)` } : undefined}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[14px] font-medium', danger && 'text-[#e5484d]')}>{label}</span>
        <span className="mt-0.5 block text-[12.5px] text-muted">{hint}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-faint" />
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
            'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150',
            value === o.value ? 'bg-elevated text-fg shadow-soft dark:bg-white/12' : 'text-muted hover:text-fg',
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
    <div className="flex items-center justify-between px-4 py-3 text-[13.5px]">
      <span>{label}</span>
      <span className="flex gap-1">
        {keys.map((k) => (
          <kbd key={k} className="grid h-6 min-w-6 place-items-center rounded-md border border-line bg-surface px-1.5 font-sans text-[11.5px] text-muted shadow-[0_1px_0_var(--line)]">
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}
