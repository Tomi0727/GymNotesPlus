import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

const LONG_PRESS_MS = 2000;
const MOVE_TOLERANCE_PX = 10;
const ITEM_ATTR = 'data-reorder-index';
const NON_DRAG_TARGETS = 'input, textarea, select, button, a, [contenteditable="true"]';

interface Press {
  x: number;
  y: number;
  timer: number;
}

interface Drag {
  from: number;
  over: number;
  startY: number;
  dy: number;
  midpoints: number[];
}

function measureMidpoints(list: HTMLElement | null): number[] {
  if (!list) return [];
  return Array.from(list.querySelectorAll<HTMLElement>(`[${ITEM_ATTR}]`), (el) => {
    const rect = el.getBoundingClientRect();
    return rect.top + rect.height / 2;
  });
}

function slotFor(midpoints: number[], from: number, y: number): number {
  return midpoints.reduce((count, mid, j) => (j !== from && mid < y ? count + 1 : count), 0);
}

export function useExerciseReorder(onReorder: (from: number, to: number) => void) {
  const listRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<Press | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const onReorderRef = useRef(onReorder);
  const [drag, setDrag] = useState<Drag | null>(null);

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  useEffect(() => {
    const cancelPress = () => {
      if (pressRef.current) window.clearTimeout(pressRef.current.timer);
      pressRef.current = null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const current = dragRef.current;
      if (current) {
        const next: Drag = {
          ...current,
          dy: e.clientY - current.startY,
          over: slotFor(current.midpoints, current.from, e.clientY),
        };
        dragRef.current = next;
        setDrag(next);
        return;
      }
      const press = pressRef.current;
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_TOLERANCE_PX) cancelPress();
    };

    const onPointerEnd = () => {
      const current = dragRef.current;
      cancelPress();
      if (!current) return;
      dragRef.current = null;
      setDrag(null);
      if (current.over !== current.from) onReorderRef.current(current.from, current.over);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (dragRef.current) e.preventDefault();
    };

    const onContextMenu = (e: Event) => {
      if (dragRef.current || pressRef.current) e.preventDefault();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('contextmenu', onContextMenu);
    return () => {
      cancelPress();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('contextmenu', onContextMenu);
    };
  }, []);

  const startPress = (index: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || dragRef.current) return;
    if ((e.target as Element).closest(NON_DRAG_TARGETS)) return;
    if (pressRef.current) window.clearTimeout(pressRef.current.timer);
    const { clientX: x, clientY: y } = e;
    const timer = window.setTimeout(() => {
      pressRef.current = null;
      const next: Drag = { from: index, over: index, startY: y, dy: 0, midpoints: measureMidpoints(listRef.current) };
      dragRef.current = next;
      setDrag(next);
      navigator.vibrate?.(40);
    }, LONG_PRESS_MS);
    pressRef.current = { x, y, timer };
  };

  return {
    listRef,
    draggingIndex: drag?.from ?? null,
    itemProps: (index: number) => ({ [ITEM_ATTR]: index, onPointerDown: startPress(index) }),
    itemStyle: (index: number): CSSProperties | undefined =>
      drag && drag.from === index ? { transform: `translateY(${drag.dy}px)`, position: 'relative', zIndex: 20 } : undefined,
    dropSide: (index: number): 'above' | 'below' | null => {
      if (!drag || drag.over === drag.from || drag.over !== index) return null;
      return drag.over < drag.from ? 'above' : 'below';
    },
  };
}
