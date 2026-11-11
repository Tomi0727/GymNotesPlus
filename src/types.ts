export interface SetEntry {
  id: string;
  reps: string;
  weight: string;
  rpe: string;
}

export interface ApproxSet {
  id: string;
  reps: string;
  weight: string;
}

export interface Exercise {
  id: string;
  title: string;
  /** Cuando está activo, la primera serie es pesada y las siguientes livianas */
  dualMode: boolean;
  sets: SetEntry[];
  approxSets: ApproxSet[];
  notes: string;
}

export interface Week {
  id: string;
  label: string;
  exercises: Exercise[];
}

export interface WorkoutDay {
  id: string;
  title: string;
  weeks: Week[];
}

export interface TrashItem {
  id: string;
  kind: 'day' | 'week' | 'exercise';
  data: WorkoutDay | Week | Exercise;
  dayId?: string;
  dayTitle?: string;
  weekId?: string;
  weekLabel?: string;
  /** Posicion que tenia dentro de su lista, para restaurarlo en el mismo lugar */
  position?: number;
  deletedAt: number;
}

export interface AppData {
  days: WorkoutDay[];
  trash: TrashItem[];
  version: number;
}
