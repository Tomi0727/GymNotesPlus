import { Plus, X } from 'lucide-react';
import type { ApproxSet } from '@/types';
import { uid } from '@/lib/storage';

const MAX_APPROX_SETS = 10;

interface Props {
  approx: ApproxSet[];
  prevApprox?: ApproxSet[];
  onChange: (approx: ApproxSet[]) => void;
}

const TILE_INPUT =
  'h-6 w-full min-w-0 bg-transparent text-center text-xs text-zinc-100 outline-none placeholder:text-zinc-500';

export function ApproxSets({ approx, prevApprox, onChange }: Props) {
  const updateApprox = (id: string, patch: Partial<ApproxSet>) =>
    onChange(approx.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const removeApprox = (id: string) => onChange(approx.filter((a) => a.id !== id));
  const addApprox = () => onChange([...approx, { id: uid(), reps: '', weight: '' }]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Series de aproximación</span>
        <span className="text-[11px] font-medium text-zinc-600">
          {approx.length}/{MAX_APPROX_SETS}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {approx.map((a, i) => {
          const prev = prevApprox?.[i];
          return (
            <div key={a.id} className="relative flex flex-col gap-1 rounded-xl bg-zinc-900/70 p-1.5 ring-1 ring-white/5">
              <button
                onClick={() => removeApprox(a.id)}
                aria-label={`Quitar aproximación ${i + 1}`}
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 transition-colors active:bg-red-500"
              >
                <X className="h-2.5 w-2.5" />
              </button>
              <input
                aria-label={`Repeticiones aproximación ${i + 1}`}
                value={a.reps}
                onChange={(e) => updateApprox(a.id, { reps: e.target.value })}
                placeholder={prev?.reps || 'reps'}
                autoComplete="off"
                className={TILE_INPUT}
              />
              <div className="h-px bg-white/5" />
              <input
                aria-label={`Peso aproximación ${i + 1}`}
                value={a.weight}
                onChange={(e) => updateApprox(a.id, { weight: e.target.value })}
                placeholder={prev?.weight || 'peso'}
                autoComplete="off"
                className={TILE_INPUT}
              />
            </div>
          );
        })}

        {approx.length < MAX_APPROX_SETS && (
          <button
            onClick={addApprox}
            aria-label="Agregar serie de aproximación"
            className="flex min-h-[62px] items-center justify-center rounded-xl border border-dashed border-zinc-700 text-emerald-400/80 transition-colors active:border-emerald-500/50 active:bg-emerald-500/10"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
