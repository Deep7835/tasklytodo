import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ArrowUp, CalendarDays, Hashtag, Plus } from 'reicon-react';
import { Popover } from './Popover';
import { CategoryDot, CategoryMenu, DueMenu, PriorityFlag, PriorityMenu } from './pickers';
import { formatDue, isOverdue } from '../lib/date';
import { parseQuickAdd } from '../lib/parse';
import { cn } from '../lib/ui';
import { useStore } from '../store/store';
import type { Priority, Task } from '../store/types';
import { PRIORITY_LABEL } from '../store/types';

interface Props {
  defaults: { categoryId: string | null; dueDate: string | null };
  onCreated?: (task: Task) => void;
  variant?: 'inline' | 'sheet';
  autoFocus?: boolean;
}

export interface QuickAddHandle {
  focus: () => void;
}

interface Overrides {
  dueDate?: string | null;
  priority?: Priority;
  categoryId?: string | null;
}

export const QuickAdd = forwardRef<QuickAddHandle, Props>(function QuickAdd({ defaults, onCreated, variant = 'inline', autoFocus }, ref) {
  const { data, addTask } = useStore();
  const [text, setText] = useState('');
  const [over, setOver] = useState<Overrides>({});
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLFormElement>(null);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  const parsed = useMemo(() => parseQuickAdd(text, data.categories), [text, data.categories]);
  const dueDate = over.dueDate !== undefined ? over.dueDate : (parsed.dueDate ?? defaults.dueDate);
  const priority = over.priority ?? parsed.priority ?? 0;
  const categoryId = over.categoryId !== undefined ? over.categoryId : (parsed.categoryId ?? defaults.categoryId);
  const category = data.categories.find((c) => c.id === categoryId);

  const expanded = variant === 'sheet' || focused || text.length > 0;
  const canSubmit = parsed.title.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    const task = addTask({ title: parsed.title, dueDate, priority, categoryId });
    setText('');
    setOver({});
    onCreated?.(task);
  };

  const refocus = () => requestAnimationFrame(() => inputRef.current?.focus());

  const chip = (active: boolean) =>
    cn(
      'inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] font-medium transition-colors',
      active ? 'border-line-strong bg-surface text-fg' : 'border-dashed border-line-strong text-muted hover:border-faint hover:text-fg',
    );

  const inline = variant === 'inline';
  const pickers = (
    <>
      <Popover
        trigger={({ toggle }) => (
          <button type="button" onClick={toggle} className={chip(!!dueDate)}>
            <CalendarDays className={cn('size-3.5', dueDate && isOverdue(dueDate) && 'text-[#e5484d]')} />
            {dueDate ? formatDue(dueDate) : 'Due date'}
          </button>
        )}
      >
        {(close) => (
          <DueMenu
            value={dueDate}
            onChange={(v) => {
              setOver((o) => ({ ...o, dueDate: v }));
              refocus();
            }}
            close={close}
          />
        )}
      </Popover>
      <Popover
        trigger={({ toggle }) => (
          <button type="button" onClick={toggle} className={chip(priority > 0)}>
            <PriorityFlag priority={priority} />
            {priority ? PRIORITY_LABEL[priority] : 'Priority'}
          </button>
        )}
      >
        {(close) => (
          <PriorityMenu
            value={priority}
            onChange={(p) => {
              setOver((o) => ({ ...o, priority: p }));
              refocus();
            }}
            close={close}
          />
        )}
      </Popover>
      <Popover
        trigger={({ toggle }) => (
          <button type="button" onClick={toggle} className={chip(!!category)}>
            {category ? <CategoryDot category={category} /> : <Hashtag className="size-3.5" />}
            {category ? category.name : 'List'}
          </button>
        )}
      >
        {(close) => (
          <CategoryMenu
            categories={data.categories}
            value={categoryId}
            onChange={(id) => {
              setOver((o) => ({ ...o, categoryId: id }));
              refocus();
            }}
            close={close}
          />
        )}
      </Popover>
    </>
  );

  return (
    <form
      ref={boxRef}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        const next = e.relatedTarget as HTMLElement | null;
        // Popovers are portalled, so treat focus moving into one as staying inside the composer.
        if (!boxRef.current?.contains(next) && !next?.closest('[data-popover]')) setFocused(false);
      }}
      className={cn(
        'group rounded-2xl transition-[background-color,border-color,box-shadow] duration-200',
        inline && 'border bg-surface',
        inline && (expanded ? 'border-line-strong shadow-soft' : 'border-line hover:border-line-strong'),
      )}
    >
      <div className={cn('flex items-center gap-3', inline ? 'px-3.5' : 'px-5')}>
        <span
          className={cn(
            'grid size-[19px] shrink-0 place-items-center rounded-full transition-colors',
            expanded ? 'bg-accent text-accent-fg' : 'border-[1.5px] border-dashed border-faint text-faint',
          )}
          aria-hidden
        >
          <Plus className={expanded ? 'size-3' : 'size-2.5'} strokeWidth={3} />
        </span>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              if (text) setText('');
              else inputRef.current?.blur();
            }
          }}
          autoFocus={autoFocus}
          placeholder={inline ? (focused ? 'Try “Call Sam tomorrow #work !high”' : 'Add a task…') : 'What do you need to do?'}
          aria-label="New task title"
          data-keep-size={!inline || undefined}
          enterKeyHint="done"
          autoComplete="off"
          className={cn('min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-faint', inline ? 'h-12 text-[14.5px]' : 'h-14 text-[17px]')}
        />
        {inline ? (
          // One row: pickers sit at the right edge of the input instead of on a second line.
          <>
            <div className={cn('flex shrink-0 items-center gap-1.5 transition-opacity duration-200', !expanded && 'opacity-60')}>{pickers}</div>
            <kbd
              className={cn(
                'rounded-md border border-line px-1.5 py-0.5 font-sans text-[11px] font-medium text-faint transition-opacity',
                canSubmit ? 'opacity-100' : 'opacity-0',
              )}
            >
              ↵
            </kbd>
          </>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary grid size-9 shrink-0 place-items-center rounded-full disabled:opacity-30"
            aria-label="Add task"
          >
            <ArrowUp className="size-[18px]" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {!inline && <div className="flex flex-wrap items-center gap-1.5 px-5 pb-4">{pickers}</div>}
    </form>
  );
});
