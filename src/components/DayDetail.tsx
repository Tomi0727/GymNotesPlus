import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Plus, CheckCircle2, Pencil, Trash2, Download, Upload } from 'lucide-react';
import type { WorkoutDay, Exercise, Week } from '@/types';
import { uid } from '@/lib/storage';
import { useExerciseReorder } from '@/lib/useExerciseReorder';
import { ExerciseCard } from './ExerciseCard';
import { ConfirmDialog } from './ConfirmDialog';

function exportWeekToLink(week: Week): boolean {
  try {
    const jsonString = JSON.stringify(week);
    const encoded = btoa(encodeURIComponent(jsonString));
    navigator.clipboard.writeText(encoded);
    return true;
  } catch (err) {
    console.error('Error al exportar semana:', err);
    return false;
  }
}

function importWeekFromLink(encodedData: string): Week | null {
  try {
    const jsonString = decodeURIComponent(atob(encodedData.trim()));
    const importedWeek = JSON.parse(jsonString) as Week;

    if (!importedWeek || !importedWeek.label || !Array.isArray(importedWeek.exercises)) {
      return null;
    }

    return {
      ...importedWeek,
      id: uid(),
      exercises: importedWeek.exercises.map((ex) => ({
        id: uid(),
        title: ex.title || '',
        dualMode: Boolean(ex.dualMode),
        sets: Array.isArray(ex.sets) ? ex.sets : [],
        approxSets: Array.isArray(ex.approxSets) ? ex.approxSets : [],
        setsReps: ex.setsReps || '',
        load: ex.load || '',
        lightSetsReps: ex.lightSetsReps || '',
        lightLoad: ex.lightLoad || '',
        notes: ex.notes || '',
      })),
    };
  } catch (err) {
    console.error('Error al importar semana:', err);
    return null;
  }
}

interface Props {
  day: WorkoutDay;
  onBack: () => void;
  onRenameDay: (title: string) => void;
  onUpdateWeek: (week: Week) => void;
  onCompleteWeek: (weekId: string) => void;
  onDeleteExercise: (weekId: string, exId: string) => void;
  onDeleteWeek: (weekId: string) => void;
  onReorderExercises: (weekId: string, from: number, to: number) => void;
}

function blankExercise(): Exercise {
  return { id: uid(), title: '', dualMode: false, sets: [], approxSets: [], notes: '' };
}

export function DayDetail({
  day,
  onBack,
  onRenameDay,
  onUpdateWeek,
  onCompleteWeek,
  onDeleteExercise,
  onDeleteWeek,
  onReorderExercises,
}: Props) {
  const [activeWeekIdx, setActiveWeekIdx] = useState(day.weeks.length - 1);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(day.title);
  const [confirmDeleteWeek, setConfirmDeleteWeek] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeWeekIdx >= day.weeks.length) {
      setActiveWeekIdx(Math.max(0, day.weeks.length - 1));
    }
  }, [day.weeks.length, activeWeekIdx]);

  useEffect(() => {
    const el = tabListRef.current?.querySelector(`[data-idx="${activeWeekIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeWeekIdx]);

  const activeWeek = day.weeks[activeWeekIdx];
  const prevWeek = activeWeekIdx > 0 ? day.weeks[activeWeekIdx - 1] : undefined;
  const isFirstWeek = activeWeekIdx === 0;

  const reorder = useExerciseReorder((from, to) => {
    if (activeWeek) onReorderExercises(activeWeek.id, from, to);
  });

  const findPrevExercise = (title: string): Exercise | undefined => {
    const t = title.trim().toLowerCase();
    if (!prevWeek || !t) return undefined;
    return prevWeek.exercises.find((e) => e.title.trim().toLowerCase() === t);
  };

  const updateExercise = (exId: string, patch: Partial<Exercise>) => {
    if (!activeWeek) return;
    onUpdateWeek({
      ...activeWeek,
      exercises: activeWeek.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)),
    });
  };

  const addExercise = () => {
    if (!activeWeek) return;
    onUpdateWeek({ ...activeWeek, exercises: [...activeWeek.exercises, blankExercise()] });
  };

  const commitRename = () => {
    const t = titleDraft.trim();
    if (t) onRenameDay(t);
    setRenaming(false);
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-28 pt-[max(0,env(safe-area-inset-top))]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-md">
        <div className="flex items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            onClick={onBack}
            className="-ml-1 rounded-xl p-2 text-zinc-400 transition-colors active:text-white"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          {renaming ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenaming(false);
              }}
              className="flex-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-base font-bold text-white outline-none ring-1 ring-emerald-500/50"
            />
          ) : (
            <h1 className="flex-1 truncate text-base font-bold text-white">{day.title}</h1>
          )}
          {!renaming && (
            <button
              onClick={() => {
                setTitleDraft(day.title);
                setRenaming(true);
              }}
              className="rounded-xl p-2 text-zinc-500 transition-colors active:text-emerald-400"
              aria-label="Renombrar día"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Week tabs + delete / export / import week */}
        {day.weeks.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3">
            <div
              ref={tabListRef}
              className="flex flex-1 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {day.weeks.map((w, i) => (
                <button
                  key={w.id}
                  data-idx={i}
                  onClick={() => setActiveWeekIdx(i)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    i === activeWeekIdx
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-zinc-800/70 text-zinc-400 active:bg-zinc-700'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={async () => {
                const activeWeek = day.weeks[activeWeekIdx];
                if (activeWeek) {
                  const ok = await exportWeekToLink(activeWeek);
                  if (ok) {
                    alert('¡Código de la semana copiado al portapapeles!');
                  } else {
                    alert('No se pudo copiar el código.');
                  }
                }
              }}
              className="shrink-0 flex items-center gap-1.5 rounded-full bg-zinc-800/70 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-emerald-400 transition-colors active:scale-95"
              title="Copiar código para exportar"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>

           <button
  onClick={() => {
    const code = prompt('Pegá el código de la semana aquí:');
    if (!code) return;

    const importedWeek = importWeekFromLink(code);
    if (!importedWeek) {
      alert('El código ingresado no es válido.');
      return;
    }

    const activeWeek = day.weeks[activeWeekIdx];
    if (activeWeek) {
      importedWeek.id = activeWeek.id;
    }
    importedWeek.label = activeWeek ? activeWeek.label : `Semana ${day.weeks.length + 1}`;

    onUpdateWeek(importedWeek);
    alert('¡Semana importada con éxito!');
  }}
  className="shrink-0 flex items-center gap-1.5 rounded-full bg-zinc-800/70 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-emerald-400 transition-colors active:scale-95"
  title="Importar semana desde código"
>
  <Upload className="h-4 w-4" />
  <span>Importar</span>
</button>

            <button
              onClick={() => setConfirmDeleteWeek(true)}
              className="shrink-0 rounded-full bg-zinc-800/70 p-2 text-zinc-500 transition-colors active:text-red-400"
              aria-label="Eliminar semana"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4">
        {day.weeks.length === 0 && (
          <div className="mt-24 flex flex-col items-center text-center">
            <p className="text-base font-medium text-zinc-300">Aún no hay semanas</p>
            <p className="mt-1 text-sm text-zinc-500">Crea tu primera semana para empezar a registrar.</p>
            <button
              onClick={() => {
                onUpdateWeek({ id: uid(), label: 'Semana 1', exercises: [] });
                setActiveWeekIdx(0);
              }}
              className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white active:bg-emerald-600"
            >
              <Plus className="h-4 w-4" /> Crear Semana 1
            </button>
          </div>
        )}

        {activeWeek && (
          <>
            <div ref={reorder.listRef} className="reorderable space-y-3">
              {activeWeek.exercises.map((ex, i) => {
                const side = reorder.dropSide(i);
                return (
                  <div key={ex.id} className="relative" style={reorder.itemStyle(i)} {...reorder.itemProps(i)}>
                    {side && (
                      <span
                        aria-hidden
                        className={`pointer-events-none absolute inset-x-3 z-30 h-1 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] ${
                          side === 'above' ? '-top-2' : '-bottom-2'
                        }`}
                      />
                    )}
                    <ExerciseCard
                      exercise={ex}
                      index={i}
                      isFirstWeek={isFirstWeek}
                      lifted={reorder.draggingIndex === i}
                      prev={findPrevExercise(ex.title)}
                      onChange={(patch) => updateExercise(ex.id, patch)}
                      onDelete={() => onDeleteExercise(activeWeek.id, ex.id)}
                    />
                  </div>
                );
              })}
            </div>

            <button
              onClick={addExercise}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 py-3.5 text-sm font-medium text-zinc-400 transition-colors active:border-emerald-500/50 active:text-emerald-400"
            >
              <Plus className="h-4 w-4" /> Añadir ejercicio
            </button>
            {activeWeek.exercises.length > 1 && (
              <p className="mt-2 text-center text-[11px] text-zinc-600">
                Mantén 2 segundos sobre un ejercicio para cambiarlo de lugar
              </p>
            )}

            <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-4 ring-1 ring-emerald-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Completar {activeWeek.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                    Crea la siguiente semana copiando los ejercicios y su estructura de series, con los campos en blanco.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onCompleteWeek(activeWeek.id);
                  setActiveWeekIdx(day.weeks.length);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] active:bg-emerald-600"
              >
                <CheckCircle2 className="h-4 w-4" /> Completar Semana
              </button>
            </div>
          </>
        )}
      </div>

      {confirmDeleteWeek && activeWeek && (
        <ConfirmDialog
          title="Eliminar semana"
          message={`Se borrará "${activeWeek.label}" con todos sus ejercicios. Podrás recuperarla desde la papelera.`}
          confirmLabel="Eliminar"
          onConfirm={() => {
            onDeleteWeek(activeWeek.id);
            setConfirmDeleteWeek(false);
          }}
          onCancel={() => setConfirmDeleteWeek(false)}
        />
      )}
    </div>
  );
}