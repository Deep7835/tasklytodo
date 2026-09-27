import { CalendarDays, CalendarX, Flag, Inbox, Sun, Sunrise, CalendarDate } from 'reicon-react';
import { useRef } from 'react';
import { MenuItem } from './Popover';
import { addDays, fromKey, nextWeekday, todayKey } from '../lib/date';
import { CATEGORY_COLORS, PRIORITY_COLOR } from '../lib/ui';
import type { Category, Priority } from '../store/types';
import { PRIORITY_LABEL } from '../store/types';

export function CategoryDot({ category, className = 'size-2' }: { category: Category | undefined; className?: string }) {
  return (
    <span
      className={`${className} inline-block shrink-0 rounded-full`}
      style={{ backgroundColor: category ? CATEGORY_COLORS[category.color] : 'var(--faint)' }}
      aria-hidden
    />
  );
}

export function PriorityFlag({ priority, className = 'size-3.5' }: { priority: Priority; className?: string }) {
  const color = PRIORITY_COLOR[priority];
  return <Flag className={className} style={color ? { color, fill: color } : undefined} aria-hidden />;
}

export function DueMenu({ value, onChange, close }: { value: string | null; onChange: (v: string | null) => void; close: () => void }) {
  const dateRef = useRef<HTMLInputElement>(null);
  const pick = (v: string | null) => {
    onChange(v);
    close();
  };
  const today = todayKey();
  const weekday = (k: string) => fromKey(k).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
  return (
    <div className="w-[220px]">
      <MenuItem icon={<Sun className="size-3.5" />} label="Today" hint={weekday(today)} selected={value === today} onClick={() => pick(today)} />
      <MenuItem
        icon={<Sunrise className="size-3.5" />}
        label="Tomorrow"
        hint={weekday(addDays(today, 1))}
        selected={value === addDays(today, 1)}
        onClick={() => pick(addDays(today, 1))}
      />
      <MenuItem
        icon={<CalendarDate className="size-3.5" />}
        label="Next week"
        hint={weekday(nextWeekday(1))}
        selected={value === nextWeekday(1)}
        onClick={() => pick(nextWeekday(1))}
      />
      <div className="my-1 h-px bg-line" />
      <label className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13.5px] text-fg hover:bg-hover">
        <CalendarDays className="size-3.5 text-muted" />
        <input
          ref={dateRef}
          type="date"
          value={value ?? ''}
          onChange={(e) => e.target.value && pick(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none"
          aria-label="Pick a date"
        />
      </label>
      {value && (
        <>
          <div className="my-1 h-px bg-line" />
          <MenuItem icon={<CalendarX className="size-3.5" />} label="No date" onClick={() => pick(null)} />
        </>
      )}
    </div>
  );
}

export function PriorityMenu({ value, onChange, close }: { value: Priority; onChange: (p: Priority) => void; close: () => void }) {
  return (
    <div className="w-[180px]">
      {([3, 2, 1, 0] as Priority[]).map((p) => (
        <MenuItem
          key={p}
          icon={<PriorityFlag priority={p} />}
          label={p === 0 ? 'No priority' : `${PRIORITY_LABEL[p]} priority`}
          hint={p ? `!${PRIORITY_LABEL[p].toLowerCase()}` : undefined}
          selected={value === p}
          onClick={() => {
            onChange(p);
            close();
          }}
        />
      ))}
    </div>
  );
}

export function CategoryMenu({
  categories,
  value,
  onChange,
  close,
}: {
  categories: Category[];
  value: string | null;
  onChange: (id: string | null) => void;
  close: () => void;
}) {
  const pick = (id: string | null) => {
    onChange(id);
    close();
  };
  return (
    <div className="max-h-[280px] w-[200px] overflow-y-auto">
      <MenuItem icon={<Inbox className="size-3.5" />} label="No list" selected={value === null} onClick={() => pick(null)} />
      {categories.map((c) => (
        <MenuItem key={c.id} icon={<CategoryDot category={c} />} label={c.name} selected={value === c.id} onClick={() => pick(c.id)} />
      ))}
    </div>
  );
}
