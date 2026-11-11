import { Fragment } from 'react';
import { Plus, X } from 'lucide-react';
import type { SetEntry } from '@/types';
import { uid } from '@/lib/storage';

interface Props {
  sets: SetEntry[];
  dualMode: boolean;
  prevSets?: SetEntry[];
  onChange: (sets: SetEntry[]) => void;
}

const FIELD =
  'h-10 min-w-0 rounded-lg bg-zinc-900/70 px-2 text-center text-sm text-zinc-100 outline-none ring-1 ring-white/5 transition-shadow placeholder:text-zinc-500 focus:ring-emerald-500/50';

function SectionChip({ tone, children }: { tone: 'amber' | 'sky'; children: string }) {
  const color = tone === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400';
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${color}`}>
      {children}
    </span>
  );
}

export function SetList({ sets, dualMode, prevSets, onChange }: Props) {
  const updateSet = (id: string, patch: Partial<SetEntry>) =>
    onChange(sets.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSet = (id: string) => onChange(sets.filter((s) => s.id !== id));
  const addSet = () => onChange([...sets, { id: uid(), reps: '', weight: '', rpe: '' }]);

  return (
    <div className="space-y-2">
      {sets.length === 0 && <p className="py-1 text-xs text-zinc-600">Aún no hay series. Agrega la primera.</p>}

      {sets.map((s, i) => {
        const prev = prevSets?.[i];
        return (
          <Fragment key={s.id}>
            {dualMode && i === 0 && <SectionChip tone="amber">Serie pesada</SectionChip>}
            {dualMode && i === 1 && <SectionChip tone="sky">Series livianas</SectionChip>}
            <div className="flex items-center gap-1.5">
              <span className="w-5 shrink-0 text-center text-xs font-bold text-zinc-500">{i + 1}</span>
              <input
                aria-label={`Repeticiones serie ${i + 1}`}
                value={s.reps}
                onChange={(e) => updateSet(s.id, { reps: e.target.value })}
                placeholder={prev?.reps || 'Reps'}
                autoComplete="off"
                className={`${FIELD} flex-1`}
              />
              <input
                aria-label={`Peso serie ${i + 1}`}
                value={s.weight}
                onChange={(e) => updateSet(s.id, { weight: e.target.value })}
                placeholder={prev?.weight || 'Peso'}
                autoComplete="off"
                className={`${FIELD} flex-1`}
              />
              <input
                aria-label={`RPE serie ${i + 1}`}
                value={s.rpe}
                onChange={(e) => updateSet(s.id, { rpe: e.target.value })}
                placeholder={prev?.rpe || 'RPE'}
                autoComplete="off"
                className={`${FIELD} w-14 shrink-0`}
              />
              <button
                onClick={() => removeSet(s.id)}
                aria-label={`Quitar serie ${i + 1}`}
                className="shrink-0 rounded-md p-1 text-zinc-600 transition-colors active:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </Fragment>
        );
      })}

      <button
        onClick={addSet}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 py-2.5 text-sm font-semibold text-emerald-400 ring-1 ring-emerald-500/30 transition-colors active:bg-emerald-500/25"
      >
        <Plus className="h-4 w-4" /> Agregar serie
      </button>
    </div>
  );
}
