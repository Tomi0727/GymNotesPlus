import { useEffect, useRef } from 'react';

export interface ToastState {
  id: number;
  message: string;
  onUndo: () => void;
}

interface Props {
  toast: ToastState | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: Props) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    timerRef.current = window.setTimeout(onDismiss, 5000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-4 rounded-2xl bg-zinc-800 px-4 py-3 shadow-2xl ring-1 ring-white/10 animate-toast-in">
        <span className="text-sm text-zinc-200">{toast.message}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              toast.onUndo();
              onDismiss();
            }}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors active:bg-emerald-600"
          >
            Deshacer
          </button>
          <button
            onClick={onDismiss}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors active:text-zinc-200"
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
