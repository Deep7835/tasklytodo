# Taskly

A fast, minimalist to-do list. Open → type → Enter → done.

React + TypeScript + Vite + Tailwind CSS v4. No backend and no account. Everything is stored in `localStorage`, and the app is an installable PWA that works fully offline.

## Scripts

```bash
npm install
npm run dev       # dev server
npm run build     # typecheck + production build (with service worker)
npm run preview   # serve the production build locally
npm run icons     # regenerate PWA icons from the inline SVG
```

The service worker is only registered in production builds, so use `build` + `preview` to test offline/PWA behavior.

## Features

- **Quick add**: press Enter to create a task. Inline tokens are parsed as you type:
  `Call Sam tomorrow #work !high`
  - `#list` sets the list (name prefix match)
  - `!high` / `!medium` / `!low` (or `!1`–`!3`) sets priority
  - a trailing `today`, `tomorrow`, or weekday (`fri`, `on monday`) sets the due date
- Filters (All · Active · Today · Completed), lists/categories, and global search across titles and notes
- Task details: title, notes, priority, due date, list, delete (with undo)
- Drag-and-drop ordering: drag the row with a mouse, long-press on touch, or use the grip handle with the keyboard
- Light / Dark / System theme, plus accent colors
- Export/Import JSON backups (merge or replace)
- Keyboard: `N` new task, `/` search, `Esc` close/clear
- Mobile: bottom tab bar, floating add button, bottom-sheet editors

## Data

| Key             | Contents                                                    |
| --------------- | ----------------------------------------------------------- |
| `taskly:data`   | `{ version, tasks, categories }` (array order = manual order) |
| `taskly:prefs`  | theme, accent, name, and view preferences                   |

Open tabs stay in sync through the `storage` event.

## Structure

```
src/
  store/        types, localStorage persistence + import validation, reducer/context
  lib/          dates, quick-add parser, view selectors, PWA helpers, hooks
  components/   QuickAdd, TaskList (dnd-kit), TaskItem, TaskDetail, Settings, Nav, Modal, Popover, Toast…
  App.tsx       layout, routing between views, shortcuts
```
