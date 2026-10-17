import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../content/registry';
import { analyzeConflict, buildScenarioMotion, findOverlap, sampleTimeline } from '../engine/timeline';

const all = CHAPTERS.flatMap((c) => c.scenarios);

describe('scenario motion', () => {
  for (const s of all) {
    describe(s.id, () => {
      const motion = buildScenarioMotion(s);

      it('declared conflicts really cross or merge', () => {
        for (const [a, b] of s.conflicts) expect(analyzeConflict(motion.paths[a]!, motion.paths[b]!)).not.toBeNull();
      });

      it('correct replay is collision-free and the priority vehicle passes first', () => {
        expect(findOverlap(motion.correct, motion.paths, 0)).toBeNull();
        const P = s.highlight.priorityVehicleId;
        const Y = s.highlight.yieldingVehicleId;
        const zone = motion.conflict!.zones;
        let checked = false;
        for (let t = 0; t <= motion.correct.duration; t += 1 / 60) {
          const pos = sampleTimeline(motion.correct, motion.paths, t);
          if (pos[Y]!.s >= zone[Y]![0]) {
            expect(pos[P]!.s).toBeGreaterThan(zone[P]![0]);
            checked = true;
            break;
          }
        }
        expect(checked).toBe(true);
        const yTrack = motion.correct.tracks.find((tr) => tr.vehicleId === Y)!;
        expect(yTrack.keys.some((k) => Math.abs(k.s - motion.paths[Y]!.stopS) < 1e-9)).toBe(true);
      });

      it('incorrect previews stop before the conflict without contact', () => {
        expect(Object.keys(motion.proposals)).toHaveLength(s.options.length - 1);
        for (const tl of Object.values(motion.proposals)) {
          expect(findOverlap(tl, motion.paths, 0)).toBeNull();
          const end = sampleTimeline(tl, motion.paths, tl.duration);
          for (const v of s.vehicles) expect(end[v.id]!.s).toBeLessThan(motion.conflict!.zones[v.id]![0]);
        }
      });

      it('step times are ordered and inside the timeline', () => {
        for (const tl of [motion.correct, ...Object.values(motion.proposals)]) {
          const times = tl.steps.map((x) => x.t);
          expect([...times].sort((a, b) => a - b)).toEqual(times);
          expect(times[0]).toBe(0);
          expect(times[times.length - 1]).toBeLessThanOrEqual(tl.duration + 1e-9);
        }
      });
    });
  }
});
