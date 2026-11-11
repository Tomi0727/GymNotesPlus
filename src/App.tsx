import { useCallback, useState } from 'react';
import type { AppData, Exercise, TrashItem, Week, WorkoutDay } from '@/types';
import { useAppData, uid } from '@/lib/storage';
import { DaysView } from '@/components/DaysView';
import { DayDetail } from '@/components/DayDetail';
import { TrashView } from '@/components/TrashView';
import { Toast, type ToastState } from '@/components/Toast';

type View = 'days' | 'trash';

function insertAt<T>(list: T[], item: T, position?: number): T[] {
  const copy = [...list];
  copy.splice(Math.min(position ?? copy.length, copy.length), 0, item);
  return copy;
}

function restoreItem(days: WorkoutDay[], item: TrashItem): WorkoutDay[] | null {
  if (item.kind === 'day') return insertAt(days, item.data as WorkoutDay, item.position);

  if (!days.some((d) => d.id === item.dayId)) return null;

  if (item.kind === 'week') {
    return days.map((d) =>
      d.id === item.dayId ? { ...d, weeks: insertAt(d.weeks, item.data as Week, item.position) } : d,
    );
  }

  const weekExists = days.some((d) => d.id === item.dayId && d.weeks.some((w) => w.id === item.weekId));
  if (!weekExists) return null;
  return days.map((d) =>
    d.id !== item.dayId
      ? d
      : {
          ...d,
          weeks: d.weeks.map((w) =>
            w.id !== item.weekId
              ? w
              : { ...w, exercises: insertAt(w.exercises, item.data as Exercise, item.position) },
          ),
        },
  );
}

export default function App() {
  const [data, setData] = useAppData();
  const [openDayId, setOpenDayId] = useState<string | null>(null);
  const [view, setView] = useState<View>('days');
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, onUndo: () => void) => {
    setToast({ id: Date.now(), message, onUndo });
  };
  const dismissToast = useCallback(() => setToast(null), []);

  /* ---------- Trash ---------- */
  const restoreTrashItem = (trashId: string) => {
    setData((prev) => {
      const item = prev.trash.find((t) => t.id === trashId);
      if (!item) return prev;
      const days = restoreItem(prev.days, item);
      if (!days) return prev;
      return { ...prev, days, trash: prev.trash.filter((t) => t.id !== trashId) };
    });
  };

  const permanentlyDelete = (trashId: string) => {
    setData((prev) => ({ ...prev, trash: prev.trash.filter((t) => t.id !== trashId) }));
  };

  const emptyTrash = () => {
    setData((prev) => ({ ...prev, trash: [] }));
  };

  /* ---------- Day CRUD ---------- */
  const addDay = (title: string) => {
    setData((prev) => ({ ...prev, days: [...prev.days, { id: uid(), title, weeks: [] }] }));
  };

  const renameDay = (id: string, title: string) => {
    setData((prev) => ({ ...prev, days: prev.days.map((d) => (d.id === id ? { ...d, title } : d)) }));
  };

  const deleteDay = (id: string) => {
    const trashId = uid();
    setData((prev) => {
      const position = prev.days.findIndex((d) => d.id === id);
      const day = prev.days[position];
      if (!day) return prev;
      return {
        ...prev,
        days: prev.days.filter((d) => d.id !== id),
        trash: [{ id: trashId, kind: 'day', data: day, position, deletedAt: Date.now() }, ...prev.trash],
      };
    });
    if (openDayId === id) setOpenDayId(null);
    showToast('Día eliminado', () => restoreTrashItem(trashId));
  };

  /* ---------- Week CRUD ---------- */
  const updateWeek = (dayId: string, week: Week) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.id !== dayId) return d;
        const exists = d.weeks.some((w) => w.id === week.id);
        return { ...d, weeks: exists ? d.weeks.map((w) => (w.id === week.id ? week : w)) : [...d.weeks, week] };
      }),
    }));
  };

  const completeWeek = (dayId: string, weekId: string) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.id !== dayId) return d;
        const week = d.weeks.find((w) => w.id === weekId);
        if (!week) return d;
        const newWeek: Week = {
          id: uid(),
          label: `Semana ${d.weeks.length + 1}`,
          exercises: week.exercises
            .filter((e) => e.title.trim())
            .map((e) => ({
              id: uid(),
              title: e.title,
              dualMode: e.dualMode,
              sets: e.sets.map((s) => ({ id: uid(), reps: '', weight: '', rpe: '' })),
              approxSets: e.approxSets.map((a) => ({ id: uid(), reps: '', weight: '' })),
              notes: '',
            })),
        };
        return { ...d, weeks: [...d.weeks, newWeek] };
      }),
    }));
  };

  const deleteWeek = (dayId: string, weekId: string) => {
    const trashId = uid();
    setData((prev) => {
      const day = prev.days.find((d) => d.id === dayId);
      if (!day) return prev;
      const position = day.weeks.findIndex((w) => w.id === weekId);
      const week = day.weeks[position];
      if (!week) return prev;
      return {
        ...prev,
        days: prev.days.map((d) => (d.id === dayId ? { ...d, weeks: d.weeks.filter((w) => w.id !== weekId) } : d)),
        trash: [
          { id: trashId, kind: 'week', data: week, dayId, dayTitle: day.title, position, deletedAt: Date.now() },
          ...prev.trash,
        ],
      };
    });
    showToast('Semana eliminada', () => restoreTrashItem(trashId));
  };

  const reorderExercises = (dayId: string, weekId: string, from: number, to: number) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.id !== dayId
          ? d
          : {
              ...d,
              weeks: d.weeks.map((w) => {
                if (w.id !== weekId) return w;
                const exercises = [...w.exercises];
                const [moved] = exercises.splice(from, 1);
                exercises.splice(to, 0, moved);
                return { ...w, exercises };
              }),
            },
      ),
    }));
  };

  const deleteExercise = (dayId: string, weekId: string, exId: string) => {
    const trashId = uid();
    setData((prev) => {
      const day = prev.days.find((d) => d.id === dayId);
      const week = day?.weeks.find((w) => w.id === weekId);
      if (!day || !week) return prev;
      const position = week.exercises.findIndex((e) => e.id === exId);
      const exercise = week.exercises[position];
      if (!exercise) return prev;
      return {
        ...prev,
        days: prev.days.map((d) =>
          d.id !== dayId
            ? d
            : {
                ...d,
                weeks: d.weeks.map((w) =>
                  w.id !== weekId ? w : { ...w, exercises: w.exercises.filter((e) => e.id !== exId) },
                ),
              },
        ),
        trash: [
          {
            id: trashId,
            kind: 'exercise',
            data: exercise,
            dayId,
            dayTitle: day.title,
            weekId,
            weekLabel: week.label,
            position,
            deletedAt: Date.now(),
          },
          ...prev.trash,
        ],
      };
    });
    showToast('Ejercicio eliminado', () => restoreTrashItem(trashId));
  };

  /* ---------- Render ---------- */
  const openDay = data.days.find((d) => d.id === openDayId) || null;

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased">
      {openDay ? (
        <DayDetail
          day={openDay}
          onBack={() => setOpenDayId(null)}
          onRenameDay={(title) => renameDay(openDay.id, title)}
          onUpdateWeek={(week) => updateWeek(openDay.id, week)}
          onCompleteWeek={(weekId) => completeWeek(openDay.id, weekId)}
          onDeleteExercise={(weekId, exId) => deleteExercise(openDay.id, weekId, exId)}
          onDeleteWeek={(weekId) => deleteWeek(openDay.id, weekId)}
          onReorderExercises={(weekId, from, to) => reorderExercises(openDay.id, weekId, from, to)}
        />
      ) : view === 'trash' ? (
        <TrashView
          trash={data.trash}
          onBack={() => setView('days')}
          onRestore={restoreTrashItem}
          onPermanentDelete={permanentlyDelete}
          onEmptyTrash={emptyTrash}
        />
      ) : (
        <DaysView
          days={data.days}
          trashCount={data.trash.length}
          onOpenDay={setOpenDayId}
          onAddDay={addDay}
          onDeleteDay={deleteDay}
          onRenameDay={renameDay}
          onOpenTrash={() => setView('trash')}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
