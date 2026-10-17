/**
 * Playback state machine. Pure reducer: time only advances through explicit
 * `tick` actions, so pausing, stepping and replaying are deterministic and
 * replaying never touches answer attempts.
 */

export interface PlaybackState {
  t: number;
  playing: boolean;
  duration: number;
  stepTimes: number[];
}

export type PlaybackAction =
  | { type: 'load'; duration: number; stepTimes: number[]; autoplay: boolean }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'toggle' }
  | { type: 'replay' }
  | { type: 'reset' }
  | { type: 'tick'; dt: number }
  | { type: 'stepNext' }
  | { type: 'stepPrev' }
  /** Reduced-motion playback: jump to the next step but keep playing until the end. */
  | { type: 'advanceDiscrete' };

const EPS = 1e-6;

export const initialPlayback: PlaybackState = { t: 0, playing: false, duration: 0, stepTimes: [0] };

function nextStepTime(state: PlaybackState): number {
  const next = state.stepTimes.find((s) => s > state.t + EPS);
  return next ?? state.duration;
}

function prevStepTime(state: PlaybackState): number {
  let prev = 0;
  for (const s of state.stepTimes) if (s < state.t - EPS) prev = s;
  return prev;
}

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'load':
      return {
        t: 0,
        playing: action.autoplay && action.duration > 0,
        duration: action.duration,
        stepTimes: [...action.stepTimes].sort((a, b) => a - b),
      };
    case 'play':
      if (state.duration <= 0) return state;
      return { ...state, playing: true, t: state.t >= state.duration - EPS ? 0 : state.t };
    case 'pause':
      return state.playing ? { ...state, playing: false } : state;
    case 'toggle':
      return playbackReducer(state, { type: state.playing ? 'pause' : 'play' });
    case 'replay':
      return { ...state, t: 0, playing: state.duration > 0 };
    case 'reset':
      return { ...state, t: 0, playing: false };
    case 'tick': {
      if (!state.playing) return state;
      const t = Math.min(state.duration, state.t + Math.max(0, action.dt));
      return { ...state, t, playing: t < state.duration - EPS };
    }
    case 'stepNext':
      return { ...state, playing: false, t: nextStepTime(state) };
    case 'stepPrev':
      return { ...state, playing: false, t: prevStepTime(state) };
    case 'advanceDiscrete': {
      if (!state.playing) return state;
      const t = nextStepTime(state);
      return { ...state, t, playing: t < state.duration - EPS };
    }
    default:
      return state;
  }
}

export function currentStepIndex(state: PlaybackState): number {
  let idx = 0;
  state.stepTimes.forEach((s, i) => {
    if (s <= state.t + EPS) idx = i;
  });
  return idx;
}
