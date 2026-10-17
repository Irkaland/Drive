import type { ExerciseMode, RuleId } from '../content/types';

/**
 * Versioned local persistence. Everything stays in this browser; nothing is
 * sent anywhere. If localStorage is unavailable (private mode, blocked
 * cookies, quota) an in-memory store keeps the session working.
 */

export const STORAGE_KEY = 'gzis-logika.progress';
export const SCHEMA_VERSION = 1;

export interface Attempt {
  /** Unique per question presentation; makes recording idempotent. */
  id: string;
  chapterId: string;
  scenarioId: string;
  /** Scenario content version the answer was given for. */
  contentVersion: number;
  ruleId: RuleId;
  mode: ExerciseMode;
  selectedOptionId: string;
  correct: boolean;
  firstAttempt: boolean;
  assistanceUsed: boolean;
  /** ISO timestamp. */
  timestamp: string;
}

export interface ProgressData {
  schemaVersion: typeof SCHEMA_VERSION;
  attempts: Attempt[];
  completedLessons: string[];
  settings: { reduceMotion: boolean | null };
}

export function emptyProgress(): ProgressData {
  return { schemaVersion: SCHEMA_VERSION, attempts: [], completedLessons: [], settings: { reduceMotion: null } };
}

export interface KeyValueStore {
  readonly persistent: boolean;
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    persistent: false,
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  };
}

/** localStorage when it actually works, otherwise an in-memory fallback. */
export function createBrowserStore(storage?: Storage | null): KeyValueStore {
  try {
    const ls = storage === undefined ? globalThis.localStorage : storage;
    if (!ls) return createMemoryStore();
    const probe = `${STORAGE_KEY}.probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    const memory = createMemoryStore();
    let persistent = true;
    return {
      get persistent() {
        return persistent;
      },
      get: (k) => {
        try {
          return persistent ? ls.getItem(k) : memory.get(k);
        } catch {
          return memory.get(k);
        }
      },
      set: (k, v) => {
        memory.set(k, v);
        if (!persistent) return;
        try {
          ls.setItem(k, v);
        } catch {
          // Quota or access error: keep working in memory for the rest of the session.
          persistent = false;
        }
      },
      remove: (k) => {
        memory.remove(k);
        try {
          ls.removeItem(k);
        } catch {
          /* ignore */
        }
      },
    };
  } catch {
    return createMemoryStore();
  }
}

const MODES: ExerciseMode[] = ['lesson', 'guided', 'independent', 'alternate'];
const RULE_IDS: RuleId[] = ['R36-4a', 'R36-4b', 'R36-4c', 'R36-4d'];

function isAttempt(x: unknown): x is Attempt {
  if (!x || typeof x !== 'object') return false;
  const a = x as Record<string, unknown>;
  return (
    typeof a.id === 'string' &&
    typeof a.chapterId === 'string' &&
    typeof a.scenarioId === 'string' &&
    typeof a.contentVersion === 'number' &&
    RULE_IDS.includes(a.ruleId as RuleId) &&
    MODES.includes(a.mode as ExerciseMode) &&
    typeof a.selectedOptionId === 'string' &&
    typeof a.correct === 'boolean' &&
    typeof a.firstAttempt === 'boolean' &&
    typeof a.assistanceUsed === 'boolean' &&
    typeof a.timestamp === 'string'
  );
}

export interface LoadResult {
  data: ProgressData;
  /** True when stored data was unreadable or partly invalid and had to be discarded. */
  recovered: boolean;
}

export function loadProgress(store: KeyValueStore): LoadResult {
  let raw: string | null;
  try {
    raw = store.get(STORAGE_KEY);
  } catch {
    return { data: emptyProgress(), recovered: true };
  }
  if (raw === null) return { data: emptyProgress(), recovered: false };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    keepCorruptCopy(store, raw);
    return { data: emptyProgress(), recovered: true };
  }
  if (!parsed || typeof parsed !== 'object' || (parsed as { schemaVersion?: unknown }).schemaVersion !== SCHEMA_VERSION) {
    keepCorruptCopy(store, raw);
    return { data: emptyProgress(), recovered: true };
  }
  const p = parsed as Partial<ProgressData>;
  const attemptsIn = Array.isArray(p.attempts) ? p.attempts : [];
  const attempts: Attempt[] = [];
  const seen = new Set<string>();
  for (const a of attemptsIn) {
    if (isAttempt(a) && !seen.has(a.id)) {
      seen.add(a.id);
      attempts.push(a);
    }
  }
  const lessonsIn = Array.isArray(p.completedLessons) ? p.completedLessons : [];
  const completedLessons = [...new Set(lessonsIn.filter((x): x is string => typeof x === 'string'))];
  const rm = p.settings?.reduceMotion;
  const data: ProgressData = {
    schemaVersion: SCHEMA_VERSION,
    attempts,
    completedLessons,
    settings: { reduceMotion: typeof rm === 'boolean' ? rm : null },
  };
  const recovered =
    !Array.isArray(p.attempts) ||
    attempts.length !== attemptsIn.length ||
    !Array.isArray(p.completedLessons) ||
    completedLessons.length !== lessonsIn.length;
  return { data, recovered };
}

function keepCorruptCopy(store: KeyValueStore, raw: string) {
  try {
    store.set(`${STORAGE_KEY}.corrupt`, raw.slice(0, 100_000));
  } catch {
    /* ignore */
  }
}

export function saveProgress(store: KeyValueStore, data: ProgressData): void {
  store.set(STORAGE_KEY, JSON.stringify(data));
}

export function clearProgress(store: KeyValueStore): void {
  store.remove(STORAGE_KEY);
  store.remove(`${STORAGE_KEY}.corrupt`);
}
