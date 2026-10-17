import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../content/registry';
import { CH1 } from '../content/chapters/ch1/manifest';
import { validateChapter } from '../content/validate';
import { evaluateAnswer } from '../engine/evaluate';
import { relativeSide } from '../engine/geometry';
import type { Scenario, VehicleSpec } from '../content/types';

const all = CHAPTERS.flatMap((c) => c.scenarios);

/**
 * Independent re-derivation of the expected priority vehicle for the limited
 * two-car cases in this chapter. It only cross-checks hand-authored answers
 * for internal consistency; it is not a legal inference engine.
 */
function expectedPriority(s: Scenario): string {
  const [v1, v2] = s.vehicles as [VehicleSpec, VehicleSpec];
  if (s.roads.kind === 'main') {
    const main = s.roads.mainArms;
    const m1 = main.includes(v1.approach);
    const m2 = main.includes(v2.approach);
    if (m1 !== m2) return m1 ? v1.id : v2.id; // 36(4)(a)
    // 36(4)(b): same road category → equal-road rules between them
  }
  const side = relativeSide(v1.approach, v2.approach);
  if (side === 'opposite') {
    // 36(4)(d)
    if (v1.maneuver === 'left' && v2.maneuver !== 'left') return v2.id;
    if (v2.maneuver === 'left' && v1.maneuver !== 'left') return v1.id;
    throw new Error(`${s.id}: opposite approaches without a unique left-turn relationship`);
  }
  // 36(4)(c): yield to the vehicle approaching from the right
  return side === 'right' ? v2.id : v1.id;
}

describe('chapter content', () => {
  it('validates without structural errors', () => {
    for (const c of CHAPTERS) expect(validateChapter(c)).toEqual([]);
  });

  it('has unique scenario ids across all chapters', () => {
    const ids = all.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references only existing vehicle ids', () => {
    for (const s of all) {
      const ids = new Set(s.vehicles.map((v) => v.id));
      for (const o of s.options) if (o.kind === 'vehicle_first') expect(ids.has(o.vehicleId)).toBe(true);
      expect(ids.has(s.highlight.priorityVehicleId)).toBe(true);
      expect(ids.has(s.highlight.yieldingVehicleId)).toBe(true);
      for (const [a, b] of s.conflicts) expect(ids.has(a) && ids.has(b)).toBe(true);
    }
  });

  it('evaluates exactly one option as correct and explains every option', () => {
    for (const s of all) {
      const results = s.options.map((o) => evaluateAnswer(s, o.id));
      expect(results.filter((r) => r.correct)).toHaveLength(1);
      for (const r of results) {
        expect(r.explanation.titleKa.length).toBeGreaterThan(3);
        expect(r.explanation.bodyKa.length).toBeGreaterThan(30);
      }
      expect(() => evaluateAnswer(s, 'nope')).toThrow();
    }
  });

  it('gives wrong options distinct, specific explanations (no generic "incorrect")', () => {
    for (const s of all) {
      const wrong = s.options.filter((o) => o.id !== s.correctOptionId).map((o) => s.explanationsByOption[o.id]!);
      for (const e of wrong) expect(e.titleKa).not.toBe('სწორია');
      expect(new Set(wrong.map((e) => e.bodyKa)).size).toBe(wrong.length);
    }
  });

  it('hand-authored answers agree with the independent cross-check', () => {
    for (const s of all) {
      const correct = s.options.find((o) => o.id === s.correctOptionId)!;
      expect(correct.kind).toBe('vehicle_first');
      if (correct.kind === 'vehicle_first') expect(correct.vehicleId, s.id).toBe(expectedPriority(s));
    }
  });

  it('states equal-road status explicitly in the prompt area', () => {
    for (const s of all.filter((x) => x.roads.kind === 'equal')) expect(s.roadStatusKa).toContain('თანაბარმნიშვნელოვანი');
  });

  it('covers every rule with a lesson, guided, independent and alternate exercise', () => {
    for (const rule of CH1.ruleIds) {
      expect(CH1.lessons.some((l) => l.ruleId === rule)).toBe(true);
      expect(CH1.alternateIdsByRule[rule]).toBeTruthy();
    }
    expect(CH1.guidedIds).toHaveLength(4);
    expect(CH1.independentIds).toHaveLength(4);
  });

  it('never claims instructor review', () => {
    for (const s of all) expect(s.reviewStatus).not.toBe('instructor_reviewed');
  });
});

describe('driver-relative right-hand relationships in fixtures', () => {
  const byId = (id: string) => all.find((s) => s.id === id)!;
  const side = (s: Scenario, from: string, to: string) =>
    relativeSide(s.vehicles.find((v) => v.id === from)!.approach, s.vehicles.find((v) => v.id === to)!.approach);

  it('seed A: northbound learner has the car from the east on its right', () => {
    expect(side(byId('ch1-G2-equal-right'), 'A', 'B')).toBe('right');
  });
  it('T2: southbound learner — the car from the west (screen-left) is on the driver’s right', () => {
    expect(side(byId('ch1-T2-equal-right-rotated'), 'A', 'B')).toBe('right');
  });
  it('seed C: B is on the learner’s right, yet the learner has priority on the main road', () => {
    const s = byId('ch1-G1-main-road');
    expect(side(s, 'A', 'B')).toBe('right');
    expect(s.correctOptionId).toBe('a_first');
  });
  it('seed D: both on the bending main road, B on the learner’s right', () => {
    expect(side(byId('ch1-G4-main-bends'), 'A', 'B')).toBe('right');
  });
  it('T4: B is not oncoming; the learner is on B’s right', () => {
    const s = byId('ch1-T4-main-bends-left');
    expect(side(s, 'A', 'B')).toBe('left');
    expect(side(s, 'B', 'A')).toBe('right');
  });
  it('seed B / T3: left-turning learner meets an oncoming vehicle', () => {
    expect(side(byId('ch1-G3-left-turn'), 'A', 'B')).toBe('opposite');
    expect(side(byId('ch1-T3-left-vs-oncoming-right'), 'A', 'B')).toBe('opposite');
  });
});
