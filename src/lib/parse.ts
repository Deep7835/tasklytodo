import type { Category, Priority } from '../store/types';
import { addDays, nextWeekday, todayKey } from './date';

export interface ParsedInput {
  title: string;
  priority?: Priority;
  dueDate?: string;
  categoryId?: string;
}

const PRIORITY_TOKENS: Record<string, Priority> = {
  '!1': 3, '!high': 3, '!h': 3,
  '!2': 2, '!medium': 2, '!med': 2, '!m': 2,
  '!3': 1, '!low': 1, '!l': 1,
};

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function dateFor(word: string): string | undefined {
  const w = word.toLowerCase();
  if (w === 'today' || w === 'tod') return todayKey();
  if (w === 'tomorrow' || w === 'tmr' || w === 'tom') return addDays(todayKey(), 1);
  const i = WEEKDAYS.findIndex((d) => d === w || d.slice(0, 3) === w);
  return i >= 0 ? nextWeekday(i) : undefined;
}

/**
 * Lightweight natural-language quick add:
 *   "Buy milk #shopping !high tomorrow"
 * - `#list` picks a list by name prefix
 * - `!high` / `!1` .. `!low` / `!3` sets priority
 * - a trailing `today`, `tomorrow`, or weekday (optionally after "on"/"by"/"due") sets the due date
 */
export function parseQuickAdd(input: string, categories: Category[]): ParsedInput {
  const out: ParsedInput = { title: '' };
  let words = input.trim().split(/\s+/).filter(Boolean);

  words = words.filter((word) => {
    const lower = word.toLowerCase();
    if (lower in PRIORITY_TOKENS) {
      out.priority = PRIORITY_TOKENS[lower];
      return false;
    }
    if (lower.startsWith('#') && lower.length > 1) {
      const q = lower.slice(1);
      const match =
        categories.find((c) => c.name.toLowerCase() === q) ??
        categories.find((c) => c.name.toLowerCase().replace(/\s+/g, '').startsWith(q));
      if (match) {
        out.categoryId = match.id;
        return false;
      }
    }
    return true;
  });

  // Only treat a date word as a date when it ends the sentence, so "Plan Friday party" stays intact.
  if (words.length > 1) {
    const due = dateFor(words[words.length - 1]);
    if (due) {
      out.dueDate = due;
      words.pop();
      const prev = words[words.length - 1]?.toLowerCase();
      if (words.length > 1 && (prev === 'on' || prev === 'by' || prev === 'due')) words.pop();
    }
  }

  out.title = words.join(' ');
  return out;
}
