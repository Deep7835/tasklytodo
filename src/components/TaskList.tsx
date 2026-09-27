import { useMemo, useState, type HTMLAttributes, type KeyboardEventHandler } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from './TaskItem';
import type { Category, Task } from '../store/types';

interface ListProps {
  tasks: Task[];
  categories: Map<string, Category>;
  sortable: boolean;
  showCategory: boolean;
  deferToggle: boolean;
  query?: string;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onReorder?: (activeId: string, overId: string) => void;
  label: string;
}

export function TaskList(props: ListProps) {
  const { tasks, sortable, onReorder, label } = props;
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    // Mouse: drag the whole row after a small movement, so plain clicks still open the task.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Touch: long-press to pick up, so normal swipes keep scrolling the page.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);

  if (!sortable) {
    return (
      <ul aria-label={label} className="flex flex-col gap-px">
        {tasks.map((t) => (
          <Row key={t.id} task={t} {...props} />
        ))}
      </ul>
    );
  }

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
    navigator.vibrate?.(8);
  };
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (e.over && e.active.id !== e.over.id) onReorder?.(String(e.active.id), String(e.over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable: 'To reorder, press space or enter on the handle, use the arrow keys to move, then press space again to drop.',
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul aria-label={label} className="relative flex flex-col gap-px">
          {tasks.map((t) => (
            <SortableRow key={t.id} task={t} {...props} anyDragging={activeId !== null} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

type RowProps = ListProps & { task: Task };

function Row({ task, categories, showCategory, query, deferToggle, onToggle, onOpen }: RowProps) {
  return (
    <TaskItem
      task={task}
      category={task.categoryId ? categories.get(task.categoryId) : undefined}
      showCategory={showCategory}
      query={query}
      deferToggle={deferToggle}
      onToggle={onToggle}
      onOpen={onOpen}
    />
  );
}

function SortableRow({ task, categories, showCategory, query, deferToggle, onToggle, onOpen, anyDragging }: RowProps & { anyDragging: boolean }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({ id: task.id });

  // Pointer/touch start drags from anywhere on the row; keyboard dragging lives on the handle so
  // Space/Enter on the checkbox or title keep their normal meaning.
  const { onKeyDown, ...pointerListeners } = (listeners ?? {}) as Record<string, (e: unknown) => void>;

  return (
    <TaskItem
      task={task}
      category={task.categoryId ? categories.get(task.categoryId) : undefined}
      showCategory={showCategory}
      query={query}
      deferToggle={deferToggle}
      onToggle={onToggle}
      onOpen={onOpen}
      sortable
      dragging={isDragging}
      setRef={setNodeRef}
      setHandleRef={setActivatorNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        cursor: anyDragging ? 'grabbing' : undefined,
      }}
      rowProps={pointerListeners as HTMLAttributes<HTMLLIElement>}
      handleProps={{ ...attributes, onKeyDown: onKeyDown as KeyboardEventHandler<HTMLButtonElement> }}
    />
  );
}
