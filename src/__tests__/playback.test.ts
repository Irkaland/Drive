import { describe, expect, it } from 'vitest';
import { currentStepIndex, initialPlayback, playbackReducer as r } from '../engine/playback';

const loaded = r(initialPlayback, { type: 'load', duration: 10, stepTimes: [0, 2, 5, 10], autoplay: false });

describe('playback', () => {
  it('loads paused at t = 0 unless autoplay', () => {
    expect(loaded).toMatchObject({ t: 0, playing: false });
    expect(r(initialPlayback, { type: 'load', duration: 10, stepTimes: [0], autoplay: true }).playing).toBe(true);
  });

  it('ticks only while playing and stops at the end', () => {
    expect(r(loaded, { type: 'tick', dt: 1 }).t).toBe(0);
    let s = r(loaded, { type: 'play' });
    s = r(s, { type: 'tick', dt: 4 });
    expect(s.t).toBe(4);
    s = r(s, { type: 'tick', dt: 100 });
    expect(s).toMatchObject({ t: 10, playing: false });
  });

  it('pauses and resumes from the same time', () => {
    let s = r(r(loaded, { type: 'play' }), { type: 'tick', dt: 3 });
    s = r(s, { type: 'pause' });
    expect(r(s, { type: 'tick', dt: 3 }).t).toBe(3);
    const resumed = r(s, { type: 'toggle' });
    expect(resumed).toMatchObject({ t: 3, playing: true });
  });

  it('reset returns to the start and stays paused', () => {
    const s = r(r(r(loaded, { type: 'play' }), { type: 'tick', dt: 6 }), { type: 'reset' });
    expect(s).toMatchObject({ t: 0, playing: false });
  });

  it('replay restarts from 0 and plays', () => {
    const s = r(r(loaded, { type: 'stepNext' }), { type: 'replay' });
    expect(s).toMatchObject({ t: 0, playing: true });
  });

  it('play at the end restarts from the beginning', () => {
    const end = r(r(loaded, { type: 'play' }), { type: 'tick', dt: 50 });
    expect(r(end, { type: 'play' })).toMatchObject({ t: 0, playing: true });
  });

  it('steps forward and back through step boundaries and pauses', () => {
    let s = r(r(loaded, { type: 'play' }), { type: 'stepNext' });
    expect(s).toMatchObject({ t: 2, playing: false });
    expect(currentStepIndex(s)).toBe(1);
    s = r(s, { type: 'stepNext' });
    expect(s.t).toBe(5);
    s = r(r(s, { type: 'stepNext' }), { type: 'stepNext' });
    expect(s.t).toBe(10);
    expect(currentStepIndex(s)).toBe(3);
    s = r(s, { type: 'stepPrev' });
    expect(s.t).toBe(5);
    s = r(s, { type: 'stepPrev' });
    expect(s.t).toBe(2);
    s = r(r(s, { type: 'stepPrev' }), { type: 'stepPrev' });
    expect(s.t).toBe(0);
  });

  it('stepping back from mid-segment lands on the previous boundary', () => {
    const s = r(r(r(loaded, { type: 'play' }), { type: 'tick', dt: 3.5 }), { type: 'stepPrev' });
    expect(s).toMatchObject({ t: 2, playing: false });
  });

  it('discrete (reduced-motion) playback jumps between steps', () => {
    let s = r(loaded, { type: 'play' });
    s = r(s, { type: 'advanceDiscrete' });
    expect(s).toMatchObject({ t: 2, playing: true });
    s = r(r(r(s, { type: 'advanceDiscrete' }), { type: 'advanceDiscrete' }), { type: 'advanceDiscrete' });
    expect(s).toMatchObject({ t: 10, playing: false });
  });
});
