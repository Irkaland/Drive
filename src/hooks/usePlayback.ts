import { useEffect, useReducer, useRef } from 'react';
import { initialPlayback, playbackReducer, type PlaybackAction, type PlaybackState } from '../engine/playback';
import type { Timeline } from '../engine/timeline';

const DISCRETE_STEP_MS = 1600;

/**
 * Drives a playback reducer from requestAnimationFrame (or, with reduced
 * motion, from a slow interval that jumps between explanation steps).
 * Hiding the tab pauses playback; it never resumes on its own.
 */
export function usePlayback(
  timeline: Timeline | null,
  opts: { autoplay: boolean; reducedMotion: boolean },
): [PlaybackState, (a: PlaybackAction) => void] {
  const [state, dispatch] = useReducer(playbackReducer, initialPlayback);
  const autoplayRef = useRef(opts.autoplay);
  autoplayRef.current = opts.autoplay;

  useEffect(() => {
    dispatch({
      type: 'load',
      duration: timeline?.duration ?? 0,
      stepTimes: timeline?.steps.map((s) => s.t) ?? [0],
      autoplay: autoplayRef.current && !!timeline,
    });
  }, [timeline]);

  useEffect(() => {
    if (!state.playing) return;
    if (opts.reducedMotion) {
      const id = window.setInterval(() => dispatch({ type: 'advanceDiscrete' }), DISCRETE_STEP_MS);
      return () => window.clearInterval(id);
    }
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      dispatch({ type: 'tick', dt });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [state.playing, opts.reducedMotion]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) dispatch({ type: 'pause' });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return [state, dispatch];
}
