import { useState } from 'react';
import { Dumbbell, Plus, Trash2, ChevronRight, Calendar } from 'lucide-react';
import type { WorkoutDay } from '@/types';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  days: WorkoutDay[];
  trashCount: number;
  onOpenDay: (id: string) => void;
  onAddDay: (title: string) => void;
  onDeleteDay: (id: string) => void;
  onRenameDay: (id: string, title: string) => void;
  onOpenTrash: () => void;
}

export function DaysView({ days, trashCount, onOpenDay, onAddDay, onDeleteDay, onRenameDay, onOpenTrash }: Props) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const submitNew = () => {
    const t = newTitle.trim();
    if (!t) return;
    onAddDay(t);
    setNewTitle('');
    setAdding(false);
  };

  const commitEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameDay(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <Dumbbell className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
  GymNotes<span className="text-emerald-400 font-extrabold">+</span>
</h1>
          <p className="text-xs text-zinc-400"> Just training and nothing else</p>
        </div>
        <button
          onClick={onOpenTrash}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400 ring-1 ring-white/5 transition-colors active:text-zinc-200"
          aria-label="Papelera"
        >
          <Trash2 className="h-5 w-5" />
          {trashCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {trashCount > 9 ? '9+' : trashCount}
            </span>
          )}
        </button>
      </header>

      {days.length === 0 && !adding && (
        <div className="mt-20 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-800/80 ring-1 ring-white/5">
            <Dumbbell className="h-8 w-8 text-zinc-600" />
          </div>
          <p className="mt-4 text-base font-medium text-zinc-300">No hay días de rutina</p>
          <p className="mt-1 text-sm text-zinc-500">Crea tu primer día para empezar a registrar entrenamientos.</p>
          <button
            onClick={() => setAdding(true)}
            className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors active:bg-emerald-600"
          >
            <Plus className="h-4 w-4" /> Crear día
          </button>
        </div>
      )}

      <div className="space-y-3">
        {days.map((day, i) => (
          <div
            key={day.id}
            className="group overflow-hidden rounded-2xl bg-zinc-800/60 ring-1 ring-white/5 transition-all active:scale-[0.99]"
          >
            {editingId === day.id ? (
              <div className="flex items-center gap-2 p-3">
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); }}
                  className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-1 ring-emerald-500/50"
                />
              </div>
            ) : (
              <div className="flex items-center">
                <button
                  onClick={() => onOpenDay(day.id)}
                  onDoubleClick={() => { setEditingId(day.id); setEditTitle(day.title); }}
                  className="flex flex-1 items-center gap-3 p-4 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-700/70 text-sm font-bold text-zinc-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-white">{day.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      {day.weeks.length} {day.weeks.length === 1 ? 'semana' : 'semanas'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-zinc-600" />
                </button>
                <button
                  onClick={() => setConfirmId(day.id)}
                  className="mr-2 rounded-lg p-2 text-zinc-600 transition-colors active:text-red-400"
                  aria-label="Eliminar día"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-4 rounded-2xl bg-zinc-800/60 p-3 ring-1 ring-emerald-500/30 animate-scale-in">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitNew(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="Ej: Día 1 - Torso"
            className="w-full rounded-lg bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-emerald-500/50"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 rounded-lg bg-zinc-700 py-2 text-sm font-medium text-zinc-200 active:bg-zinc-600">Cancelar</button>
            <button onClick={submitNew} className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white active:bg-emerald-600">Añadir</button>
          </div>
        </div>
      )}

      {days.length > 0 && !adding && (
        <button
          onClick={() => setAdding(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 py-3.5 text-sm font-medium text-zinc-400 transition-colors active:border-emerald-500/50 active:text-emerald-400"
        >
          <Plus className="h-4 w-4" /> Nuevo día
        </button>
      )}

      <p className="mt-8 px-2 text-center text-xs text-zinc-600">
        ¿Qué vamos a hacer hoy?
      </p>

      {confirmId && (
        <ConfirmDialog
          title="Eliminar día"
          message="Se borrará este día y todas sus semanas y ejercicios."
          onConfirm={() => { onDeleteDay(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
