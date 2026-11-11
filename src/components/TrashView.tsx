import { useState } from 'react';
import { ArrowLeft, Trash2, RotateCcw, Calendar, Dumbbell, Layers, AlertTriangle } from 'lucide-react';
import type { TrashItem, Exercise, Week, WorkoutDay } from '@/types';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  trash: TrashItem[];
  onBack: () => void;
  onRestore: (trashId: string) => void;
  onPermanentDelete: (trashId: string) => void;
  onEmptyTrash: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr}h`;
  const days = Math.floor(hr / 24);
  return `hace ${days}d`;
}

function itemTitle(item: TrashItem): string {
  if (item.kind === 'day') return (item.data as WorkoutDay).title || 'Día sin título';
  if (item.kind === 'week') return (item.data as Week).label || 'Semana';
  return (item.data as Exercise).title || 'Ejercicio sin nombre';
}

function itemSubtitle(item: TrashItem): string {
  if (item.kind === 'day') {
    const d = item.data as WorkoutDay;
    return `${d.weeks.length} ${d.weeks.length === 1 ? 'semana' : 'semanas'}`;
  }
  if (item.kind === 'week') {
    const w = item.data as Week;
    return `${w.exercises.length} ${w.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} · ${item.dayTitle ?? ''}`;
  }
  const ex = item.data as Exercise;
  const n = ex.sets.length;
  return `${item.dayTitle ?? ''} · ${item.weekLabel ?? ''} · ${n} ${n === 1 ? 'serie' : 'series'}`;
}

const kindIcon = {
  day: Dumbbell,
  week: Calendar,
  exercise: Layers,
};

const kindLabel = {
  day: 'Día',
  week: 'Semana',
  exercise: 'Ejercicio',
};

const kindColor = {
  day: 'text-emerald-400 bg-emerald-500/15',
  week: 'text-sky-400 bg-sky-500/15',
  exercise: 'text-amber-400 bg-amber-500/15',
};

export function TrashView({ trash, onBack, onRestore, onPermanentDelete, onEmptyTrash }: Props) {
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<string | null>(null);

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="-ml-1 rounded-xl p-2 text-zinc-400 transition-colors active:text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-800/80 ring-1 ring-white/5">
          <Trash2 className="h-5 w-5 text-zinc-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-white">Papelera</h1>
          <p className="text-xs text-zinc-500">{trash.length} {trash.length === 1 ? 'elemento' : 'elementos'}</p>
        </div>
        {trash.length > 0 && (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="rounded-lg p-2 text-zinc-500 transition-colors active:text-red-400"
            aria-label="Vaciar papelera"
          >
            <AlertTriangle className="h-4 w-4" />
          </button>
        )}
      </header>

      {trash.length === 0 && (
        <div className="mt-20 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-800/80 ring-1 ring-white/5">
            <Trash2 className="h-8 w-8 text-zinc-600" />
          </div>
          <p className="mt-4 text-base font-medium text-zinc-300">La papelera está vacía</p>
          <p className="mt-1 text-sm text-zinc-500">Los elementos que elimines aparecerán aquí para recuperarlos.</p>
        </div>
      )}

      <div className="space-y-3">
        {trash.map((item) => {
          const Icon = kindIcon[item.kind];
          return (
            <div key={item.id} className="overflow-hidden rounded-2xl bg-zinc-800/60 ring-1 ring-white/5">
              <div className="flex items-center gap-3 p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${kindColor[item.kind]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-white">{itemTitle(item)}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{itemSubtitle(item)}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-600">{timeAgo(item.deletedAt)}</p>
                </div>
              </div>
              <div className="flex gap-2 border-t border-white/5 px-4 py-2.5">
                <span className="flex items-center rounded-md bg-zinc-700/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  {kindLabel[item.kind]}
                </span>
                <div className="flex-1" />
                <button
                  onClick={() => onPermanentDelete(item.id)}
                  className="flex items-center gap-1 rounded-lg bg-zinc-700/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors active:text-red-400"
                >
                  <Trash2 className="h-3 w-3" /> Borrar
                </button>
                <button
                  onClick={() => onRestore(item.id)}
                  className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors active:bg-emerald-500/25"
                >
                  <RotateCcw className="h-3 w-3" /> Restaurar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {trash.length > 0 && (
        <p className="mt-8 px-2 text-center text-xs text-zinc-600">
          Los elementos permanecen aquí hasta que los restaures o los borres definitivamente.
        </p>
      )}

      {confirmEmpty && (
        <ConfirmDialog
          title="Vaciar papelera"
          message="Se borrarán permanentemente todos los elementos de la papelera. Esta acción no se puede deshacer."
          confirmLabel="Vaciar todo"
          onConfirm={() => { onEmptyTrash(); setConfirmEmpty(false); }}
          onCancel={() => setConfirmEmpty(false)}
        />
      )}

      {confirmDeleteItem && (
        <ConfirmDialog
          title="Borrar definitivamente"
          message="Este elemento se eliminará para siempre y no podrá ser recuperado."
          confirmLabel="Borrar"
          onConfirm={() => { onPermanentDelete(confirmDeleteItem); setConfirmDeleteItem(null); }}
          onCancel={() => setConfirmDeleteItem(null)}
        />
      )}
    </div>
  );
}
