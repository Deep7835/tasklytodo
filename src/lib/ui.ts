import type { Accent, CategoryColor, Priority } from '../store/types';

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export const CATEGORY_COLORS: Record<CategoryColor, string> = {
  slate: '#8b8f9a',
  red: '#e5484d',
  orange: '#f07833',
  amber: '#e6a117',
  green: '#30a46c',
  teal: '#12a594',
  blue: '#3e8cf0',
  indigo: '#6366f1',
  violet: '#8e5cf0',
  pink: '#e54ba0',
};

export const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: 'indigo', label: 'Indigo', swatch: '#5b5ce6' },
  { id: 'blue', label: 'Blue', swatch: '#2f76f0' },
  { id: 'teal', label: 'Teal', swatch: '#0f9384' },
  { id: 'green', label: 'Green', swatch: '#219653' },
  { id: 'amber', label: 'Amber', swatch: '#d97b06' },
  { id: 'rose', label: 'Rose', swatch: '#e0435a' },
  { id: 'graphite', label: 'Graphite', swatch: '#3a3d46' },
];

/** Priority tint used for checkbox rings and flags. `null` = neutral. */
export const PRIORITY_COLOR: Record<Priority, string | null> = {
  0: null,
  1: '#3e8cf0',
  2: '#e6a117',
  3: '#e5484d',
};

const LIST_COLOR_ORDER: CategoryColor[] = ['blue', 'violet', 'amber', 'green', 'pink', 'teal', 'orange', 'red', 'indigo', 'slate'];

/** First vivid color not already used by a list (falls back to cycling). */
export function nextListColor(used: { color: CategoryColor }[]): CategoryColor {
  const taken = new Set(used.map((c) => c.color));
  return LIST_COLOR_ORDER.find((c) => !taken.has(c)) ?? LIST_COLOR_ORDER[used.length % LIST_COLOR_ORDER.length];
}
