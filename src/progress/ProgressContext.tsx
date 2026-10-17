import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  clearProgress,
  createBrowserStore,
  emptyProgress,
  loadProgress,
  saveProgress,
  type Attempt,
  type KeyValueStore,
  type ProgressData,
} from './storage';
import { completeLesson as completeLessonPure, recordAttempt as recordAttemptPure, type AttemptInput } from './progress';

interface ProgressApi {
  data: ProgressData;
  persistent: boolean;
  recovered: boolean;
  dismissRecovered: () => void;
  recordAttempt: (input: AttemptInput) => { attempt: Attempt; duplicate: boolean };
  completeLesson: (scenarioId: string) => void;
  setReduceMotion: (value: boolean | null) => void;
  resetAll: () => void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children, store }: { children: ReactNode; store?: KeyValueStore }) {
  const storeRef = useRef<KeyValueStore>(store ?? createBrowserStore());
  const initial = useMemo(() => loadProgress(storeRef.current), []);
  // The ref mirrors state synchronously so two submissions in the same tick see each other.
  const dataRef = useRef<ProgressData>(initial.data);
  const [data, setData] = useState<ProgressData>(initial.data);
  const [recovered, setRecovered] = useState(initial.recovered);

  const commit = useCallback((next: ProgressData) => {
    dataRef.current = next;
    saveProgress(storeRef.current, next);
    setData(next);
  }, []);

  const recordAttempt = useCallback(
    (input: AttemptInput) => {
      const res = recordAttemptPure(dataRef.current, input);
      if (!res.duplicate) commit(res.data);
      return { attempt: res.attempt, duplicate: res.duplicate };
    },
    [commit],
  );

  const completeLesson = useCallback(
    (scenarioId: string) => {
      const next = completeLessonPure(dataRef.current, scenarioId);
      if (next !== dataRef.current) commit(next);
    },
    [commit],
  );

  const setReduceMotion = useCallback(
    (value: boolean | null) => commit({ ...dataRef.current, settings: { ...dataRef.current.settings, reduceMotion: value } }),
    [commit],
  );

  const resetAll = useCallback(() => {
    clearProgress(storeRef.current);
    const fresh = { ...emptyProgress(), settings: dataRef.current.settings };
    commit(fresh);
    setRecovered(false);
  }, [commit]);

  const api = useMemo<ProgressApi>(
    () => ({
      data,
      persistent: storeRef.current.persistent,
      recovered,
      dismissRecovered: () => setRecovered(false),
      recordAttempt,
      completeLesson,
      setReduceMotion,
      resetAll,
    }),
    [data, recovered, recordAttempt, completeLesson, setReduceMotion, resetAll],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress must be used inside ProgressProvider');
  return v;
}
