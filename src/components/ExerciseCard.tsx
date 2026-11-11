import { useState, useEffect } from 'react';
import { GripVertical, Trash2, Timer } from 'lucide-react';
import type { Exercise } from '@/types';
import { ToggleSwitch } from './ToggleSwitch';
import { ConfirmDialog } from './ConfirmDialog';
import { SetList } from './SetList';
import { ApproxSets } from './ApproxSets';

interface Props {
  exercise: Exercise;
  index: number;
  isFirstWeek: boolean;
  lifted: boolean;
  prev?: Exercise;
  onChange: (patch: Partial<Exercise>) => void;
  onDelete: () => void;
}

export function ExerciseCard({ exercise, index, isFirstWeek, lifted, prev, onChange, onDelete }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [restTime, setRestTime] = useState<number | null>(null);

  useEffect(() => {
    if (restTime === null || restTime <= 0) return;

    const timer = setInterval(() => {
      setRestTime((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [restTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDualToggle = (on: boolean) => {
    if (on) onChange({ dualMode: true });
    else setDeactivating(true);
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-zinc-800/50 ring-1 transition-shadow duration-200 ${
        lifted ? 'shadow-2xl shadow-black/60 ring-emerald-500/60' : 'ring-white/5'
      }`}
    >
      {/* Header del ejercicio */}
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2.5">
        <GripVertical className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-700/70 text-xs font-bold text-zinc-400">
          {index + 1}
        </span>
        <input
          value={exercise.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Nombre del ejercicio"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-zinc-600"
        />

        {/* Botón rápido de descanso */}
        <button
          onClick={() => setRestTime(120)}
          className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
          title="Iniciar 2 min de descanso"
        >
          <Timer className="h-3.5 w-3.5" />
          <span>Descanso</span>
        </button>

        <button
          onClick={() => setConfirmingDelete(true)}
          aria-label="Eliminar ejercicio"
          className="shrink-0 rounded-lg p-1.5 text-zinc-600 transition-colors active:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Switch de series pesada/ligeras */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {exercise.dualMode ? 'Pesada + livianas' : 'Series generales'}
          </p>
          {!isFirstWeek && <p className="mt-0.5 text-[10px] text-zinc-600">Fijado desde la semana 1</p>}
        </div>
        <ToggleSwitch checked={exercise.dualMode} onChange={handleDualToggle} label="" disabled={!isFirstWeek} />
      </div>

      {/* Listas de series + Timer + Notas */}
      <div className="space-y-5 p-3">
        <SetList
          sets={exercise.sets}
          dualMode={exercise.dualMode}
          prevSets={prev?.sets}
          onChange={(sets) => {
            const newlyCompleted = sets.some(
              (s, i) => s.completed && !exercise.sets[i]?.completed
            );
            if (newlyCompleted) setRestTime(90);
            onChange({ sets });
          }}
        />

        <ApproxSets
          approx={exercise.approxSets}
          prevApprox={prev?.approxSets}
          onChange={(approxSets) => onChange({ approxSets })}
        />

        {/* Timer de descanso */}
        {restTime !== null && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-400">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Descanso</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-white">{formatTime(restTime)}</span>
              <button
                onClick={() => setRestTime(null)}
                className="text-zinc-500 hover:text-zinc-300 active:scale-95"
              >
                ✕
              </button>
            </div>
          </div>
        )}

{/* Cuadro de notas agrandado */}
        <label className="block mt-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Notas / Sensaciones</span>
          <textarea
            value={exercise.notes || ''}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder={prev?.notes?.trim() || 'Cómo te sentiste, técnica, ajustes (sillón, RPE...)'}
            rows={4}
            className="mt-1.5 h-24 w-full resize-y rounded-xl bg-zinc-900/90 px-3 py-2.5 text-xs leading-relaxed text-zinc-100 outline-none ring-1 ring-white/10 placeholder:text-zinc-600 focus:ring-emerald-500/50 transition-all"
          />
        </label>
      </div>

      {/* Cartel de confirmación de eliminación */}
      {confirmingDelete && (
        <div className="flex items-center justify-between gap-2 border-t border-red-500/20 bg-red-500/10 px-3 py-2.5 animate-scale-in">
          <span className="text-xs text-red-300">Se enviará a la papelera</span>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 active:bg-zinc-600"
            >
              No
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white active:bg-red-600"
            >
              Sí, borrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación para desactivar dual mode */}
      {deactivating && (
        <ConfirmDialog
          title="Desactivar series pesada/livianas"
          message="Se borrarán las series livianas de este ejercicio y se conservará solo la serie pesada. Esto borra progreso y no se puede deshacer. ¿Deseas continuar?"
          confirmLabel="Sí, desactivar"
          onConfirm={() => {
            onChange({ dualMode: false, sets: exercise.sets.slice(0, 1) });
            setDeactivating(false);
          }}
          onCancel={() => setDeactivating(false)}
        />
      )}
    </div>
  );
}