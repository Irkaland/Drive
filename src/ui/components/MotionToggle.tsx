import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useProgress } from '../../progress/ProgressContext';

/**
 * Reduced-motion switch. Defaults to the system setting; once toggled, the
 * learner's choice is remembered locally. With reduced motion, playback
 * jumps between explanation steps instead of animating continuously.
 */
export function MotionToggle() {
  const reduced = useReducedMotion();
  const { data, setReduceMotion } = useProgress();
  return (
    <button
      type="button"
      className="motion-toggle"
      aria-pressed={reduced}
      onClick={() => setReduceMotion(!reduced)}
      title={data.settings.reduceMotion === null ? 'ახლა მიჰყვება მოწყობილობის პარამეტრს' : undefined}
    >
      <span className="motion-toggle-dot" aria-hidden="true" />
      შემცირებული მოძრაობა
    </button>
  );
}
