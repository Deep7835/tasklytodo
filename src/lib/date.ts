const pad = (n: number) => String(n).padStart(2, '0');

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = () => toKey(new Date());

export function addDays(key: string, days: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

/** Whole days from today to `key` (negative = past). */
export function daysFromToday(key: string): number {
  const ms = fromKey(key).getTime() - fromKey(todayKey()).getTime();
  return Math.round(ms / 86_400_000);
}

export const isOverdue = (key: string | null) => !!key && daysFromToday(key) < 0;
export const isDueToday = (key: string | null) => !!key && daysFromToday(key) === 0;

export function nextWeekday(target: number): string {
  const today = new Date();
  const diff = (target - today.getDay() + 7) % 7 || 7;
  return addDays(todayKey(), diff);
}

export function formatDue(key: string): string {
  const diff = daysFromToday(key);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  const d = fromKey(key);
  if (diff > 1 && diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export const longDate = (date = new Date()) =>
  date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
