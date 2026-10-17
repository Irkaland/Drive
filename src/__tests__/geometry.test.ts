import { describe, expect, it } from 'vitest';
import { buildPath, exitArm, plateDirection, relativeSide, rightOf, CENTER, LANE_OFFSET } from '../engine/geometry';
import type { Arm, Maneuver, VehicleSpec } from '../content/types';

const v = (approach: Arm, maneuver: Maneuver): VehicleSpec => ({
  id: 'X',
  label: 'X',
  isLearner: true,
  approach,
  maneuver,
  body: 'sedan',
  color: '#000',
  appearanceKa: '',
});

describe('driver-relative directions', () => {
  it('derives the right-hand side from the heading, not the screen', () => {
    expect(rightOf('N')).toBe('E');
    expect(rightOf('S')).toBe('W');
    expect(relativeSide('S', 'E')).toBe('right'); // heading north
    expect(relativeSide('N', 'W')).toBe('right'); // heading south: screen-left is driver-right
    expect(relativeSide('E', 'N')).toBe('right'); // heading west
    expect(relativeSide('W', 'S')).toBe('right'); // heading east
    expect(relativeSide('S', 'N')).toBe('opposite');
    expect(relativeSide('S', 'W')).toBe('left');
  });

  it('computes exit arms for each maneuver', () => {
    expect(exitArm('S', 'straight')).toBe('N');
    expect(exitArm('S', 'left')).toBe('W');
    expect(exitArm('S', 'right')).toBe('E');
    expect(exitArm('N', 'left')).toBe('E');
    expect(exitArm('E', 'right')).toBe('N');
  });

  it('draws direction plates from the driver’s point of view', () => {
    expect(plateDirection('S', 'E')).toBe('right');
    expect(plateDirection('E', 'S')).toBe('left');
    expect(plateDirection('N', 'E')).toBe('left');
    expect(plateDirection('W', 'N')).toBe('left');
    expect(plateDirection('S', 'S')).toBe('bottom');
    expect(plateDirection('S', 'N')).toBe('top');
  });
});

/** Lane centre line for traffic heading toward `dir` (right-hand traffic). */
function laneOf(dir: Arm): { axis: 'x' | 'y'; value: number } {
  switch (dir) {
    case 'N':
      return { axis: 'x', value: CENTER.x + LANE_OFFSET };
    case 'S':
      return { axis: 'x', value: CENTER.x - LANE_OFFSET };
    case 'E':
      return { axis: 'y', value: CENTER.y + LANE_OFFSET };
    case 'W':
      return { axis: 'y', value: CENTER.y - LANE_OFFSET };
  }
}

const HEADING_ANGLE: Record<Arm, number> = { N: 0, E: 90, S: 180, W: -90 };
const norm = (a: number) => ((((a % 360) + 540) % 360) - 180);
const HEADING_OF: Record<Arm, Arm> = { S: 'N', N: 'S', E: 'W', W: 'E' };

describe('paths stay in right-hand lanes and end with a consistent heading', () => {
  const arms: Arm[] = ['N', 'E', 'S', 'W'];
  const maneuvers: Maneuver[] = ['straight', 'left', 'right'];
  for (const a of arms)
    for (const m of maneuvers) {
      it(`${a} ${m}`, () => {
        const p = buildPath(v(a, m));
        const start = p.samples[0]!;
        const end = p.samples[p.samples.length - 1]!;
        const heading = HEADING_OF[a];
        const entry = laneOf(heading);
        expect(entry.axis === 'x' ? start.x : start.y).toBeCloseTo(entry.value, 5);
        const exit = laneOf(exitArm(a, m));
        expect(exit.axis === 'x' ? end.x : end.y).toBeCloseTo(exit.value, 5);
        expect(Math.abs(norm(start.angle - HEADING_ANGLE[heading]))).toBeLessThan(1);
        expect(Math.abs(norm(end.angle - HEADING_ANGLE[exitArm(a, m)]))).toBeLessThan(1);
        for (let i = 1; i < p.samples.length; i++) {
          expect(Math.abs(norm(p.samples[i]!.angle - p.samples[i - 1]!.angle))).toBeLessThan(20);
        }
        expect(p.stopS).toBeGreaterThan(0);
      });
    }
});
