import { useEffect, useState } from 'react';
import { useProgress } from '../progress/ProgressContext';

const QUERY = '(prefers-reduced-motion: reduce)';

function systemPrefersReduced(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches;
  } catch {
    return false;
  }
}

/** System preference, unless the learner chose otherwise in the header toggle. */
export function useReducedMotion(): boolean {
  const { data } = useProgress();
  const [system, setSystem] = useState(systemPrefersReduced);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const on = () => setSystem(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return data.settings.reduceMotion ?? system;
}
