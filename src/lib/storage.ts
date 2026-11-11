import { useEffect, useRef, useState } from 'react';
import type { AppData, Exercise, SetEntry, TrashItem, Week, WorkoutDay } from '@/types';

const STORAGE_KEY = 'gym-tracker-v1';

interface LegacyExercise {
  id?: string;
  title?: string;
  dualMode?: boolean;
  notes?: string;
  setsReps?: string;
  load?: string;
  lightSetsReps?: string;
  lightLoad?: string;
  sets?: SetEntry[];
  approxSets?: Exercise['approxSets'];
}

function emptyData(): AppData {
  return { days: [], trash: [], version: 1 };
}

function legacySets(ex: LegacyExercise): SetEntry[] {
  const sets: SetEntry[] = [];
  if (ex.setsReps || ex.load) sets.push({ id: uid(), reps: ex.setsReps ?? '', weight: ex.load ?? '', rpe: '' });
  if (ex.lightSetsReps || ex.lightLoad) {
    sets.push({ id: uid(), reps: ex.lightSetsReps ?? '', weight: ex.lightLoad ?? '', rpe: '' });
  }
  return sets;
}

function migrateExercise(ex: LegacyExercise): Exercise {
  return {
    id: ex.id ?? uid(),
    title: ex.title ?? '',
    dualMode: ex.dualMode ?? false,
    sets: ex.sets ?? legacySets(ex),
    approxSets: ex.approxSets ?? [],
    notes: ex.notes ?? '',
  };
}

function migrateWeek(w: Week): Week {
  return { ...w, exercises: w.exercises.map(migrateExercise) };
}

function migrateDay(d: WorkoutDay): WorkoutDay {
  return { ...d, weeks: d.weeks.map(migrateWeek) };
}

function migrateTrashItem(t: TrashItem): TrashItem {
  if (t.kind === 'day') return { ...t, data: migrateDay(t.data as WorkoutDay) };
  if (t.kind === 'week') return { ...t, data: migrateWeek(t.data as Week) };
  return { ...t, data: migrateExercise(t.data as Exercise) };
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (!parsed.days) return emptyData();
    return {
      days: parsed.days.map(migrateDay),
      trash: (parsed.trash ?? []).map(migrateTrashItem),
      version: 1,
    };
  } catch {
    return emptyData();
  }
}

export function saveAppData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => saveAppData(data), 250);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [data]);

  return [data, setData] as const;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
import type { Week } from '@/types';

// Exportar una semana a un archivo .json
export const exportWeekToJSON = (week: Week, dayTitle: string) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(week, null, 2));
  const downloadAnchor = document.createElement('a');
  
  // Nombre del archivo ej: "Torso-Semana 1.json"
  const fileName = `${dayTitle.replace(/\s+/g, '_')}_${week.label.replace(/\s+/g, '_')}.json`;
  
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

// Importar una semana desde un archivo .json seleccionado
export const importWeekFromJSON = (file: File): Promise<Week> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedWeek = JSON.parse(event.target?.result as string) as Week;
        
        // Validación básica de estructura
        if (!importedWeek.label || !Array.isArray(importedWeek.exercises)) {
          throw new Error('El archivo no tiene el formato de semana válido');
        }

        // Generamos IDs nuevos para no colisionar con semanas existentes
        const newWeek: Week = {
          ...importedWeek,
          id: crypto.randomUUID(),
          exercises: importedWeek.exercises.map(ex => ({
            ...ex,
            id: crypto.randomUUID()
          }))
        };

        resolve(newWeek);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};
