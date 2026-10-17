import type { Arm, Maneuver, VehicleSpec } from '../content/types';

/**
 * Scene geometry for a plain four-way intersection with one lane per direction
 * and right-hand traffic.
 *
 * Scene units: the intersection centre is (300, 300); screen y grows downward;
 * north is screen-up. Every approach is authored once in a canonical
 * "south frame" (vehicle approaching from the south, heading north) and rotated
 * clockwise by the approach angle. Driver-relative directions are therefore
 * always computed from the vehicle's heading, never from screen position.
 */

export const CENTER = { x: 300, y: 300 } as const;
export const LANE_WIDTH = 50;
export const HALF_ROAD = LANE_WIDTH; // two lanes: road spans centre ± 50
export const LANE_OFFSET = LANE_WIDTH / 2; // lane centre from road centre line
export const STOP_LINE = 62; // distance from centre to the transverse stop/give-way line
export const CAR_HALF_LENGTH = 23;
export const DEFAULT_START_DISTANCE = 165;
/** Paths end well outside the visible viewBox so vehicles leave the scene. */
export const PATH_END = 330;

export const ARMS: readonly Arm[] = ['N', 'E', 'S', 'W'];

/** Clockwise rotation (degrees) that maps the south frame onto an approach arm. */
const APPROACH_ANGLE: Record<Arm, number> = { S: 0, W: 90, N: 180, E: 270 };

export function approachAngle(arm: Arm): number {
  return APPROACH_ANGLE[arm];
}

export function oppositeOf(arm: Arm): Arm {
  return ({ N: 'S', S: 'N', E: 'W', W: 'E' } as const)[arm];
}

/** Direction of travel while approaching from `arm` (coming from south → heading north). */
export function headingOf(approach: Arm): Arm {
  return oppositeOf(approach);
}

/** The compass direction on a driver's right when travelling toward `heading`. */
export function rightOf(heading: Arm): Arm {
  return ({ N: 'E', E: 'S', S: 'W', W: 'N' } as const)[heading];
}

export function leftOf(heading: Arm): Arm {
  return ({ N: 'W', W: 'S', S: 'E', E: 'N' } as const)[heading];
}

/** Arm through which a vehicle leaves the intersection. */
export function exitArm(approach: Arm, maneuver: Maneuver): Arm {
  const heading = headingOf(approach);
  if (maneuver === 'straight') return heading;
  if (maneuver === 'left') return leftOf(heading);
  return rightOf(heading);
}

export type RelativeSide = 'right' | 'left' | 'opposite' | 'same';

/**
 * Where a vehicle approaching from `otherApproach` is, as seen by a driver
 * approaching from `observerApproach` (computed from the observer's heading).
 */
export function relativeSide(observerApproach: Arm, otherApproach: Arm): RelativeSide {
  const heading = headingOf(observerApproach);
  if (otherApproach === observerApproach) return 'same';
  if (otherApproach === rightOf(heading)) return 'right';
  if (otherApproach === leftOf(heading)) return 'left';
  return 'opposite';
}

/**
 * Position of `arm` on a direction plate drawn for a driver approaching from
 * `driverApproach` (driver's own approach at the bottom of the plate).
 */
export function plateDirection(driverApproach: Arm, arm: Arm): 'bottom' | 'top' | 'left' | 'right' {
  const side = relativeSide(driverApproach, arm);
  if (side === 'same') return 'bottom';
  if (side === 'opposite') return 'top';
  return side;
}

export function areOpposite(a: Arm, b: Arm): boolean {
  return oppositeOf(a) === b;
}

export interface Point {
  x: number;
  y: number;
}

export function rotatePoint(p: Point, degrees: number): Point {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

/** Convert a south-frame point (relative to centre) to absolute scene coordinates for `arm`. */
export function fromSouthFrame(p: Point, arm: Arm): Point {
  const r = rotatePoint(p, approachAngle(arm));
  return { x: CENTER.x + r.x, y: CENTER.y + r.y };
}

export interface PathSample {
  x: number;
  y: number;
  /** Heading in degrees, clockwise from screen-up. */
  angle: number;
  /** Cumulative distance from the path start. */
  s: number;
}

export interface VehiclePath {
  vehicleId: string;
  samples: PathSample[];
  length: number;
  /** Distance at which the vehicle's front reaches the stop/give-way line. */
  stopS: number;
}

const SAMPLE_STEP = 2;

function southFramePoints(maneuver: Maneuver, startDistance: number): Point[] {
  const pts: Point[] = [];
  const pushLine = (a: Point, b: Point) => {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(len / SAMPLE_STEP));
    for (let i = pts.length === 0 ? 0 : 1; i <= n; i++) {
      const t = i / n;
      pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  };
  const pushArc = (cx: number, cy: number, r: number, fromDeg: number, toDeg: number) => {
    const len = (Math.abs(toDeg - fromDeg) * Math.PI * r) / 180;
    const n = Math.max(2, Math.ceil(len / SAMPLE_STEP));
    for (let i = 1; i <= n; i++) {
      const a = ((fromDeg + ((toDeg - fromDeg) * i) / n) * Math.PI) / 180;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  };

  const entry: Point = { x: LANE_OFFSET, y: startDistance };
  const edge: Point = { x: LANE_OFFSET, y: HALF_ROAD };
  if (maneuver === 'straight') {
    pushLine(entry, { x: LANE_OFFSET, y: -PATH_END });
  } else if (maneuver === 'left') {
    // Wide left turn into the far-side lane of the left-hand road.
    pushLine(entry, edge);
    pushArc(-HALF_ROAD, HALF_ROAD, HALF_ROAD + LANE_OFFSET, 0, -90);
    pushLine({ x: -HALF_ROAD, y: -LANE_OFFSET }, { x: -PATH_END, y: -LANE_OFFSET });
  } else {
    // Tight right turn into the near-side lane of the right-hand road.
    pushLine(entry, edge);
    pushArc(HALF_ROAD, HALF_ROAD, LANE_OFFSET, 180, 270);
    pushLine({ x: HALF_ROAD, y: LANE_OFFSET }, { x: PATH_END, y: LANE_OFFSET });
  }
  return pts;
}

export function buildPath(vehicle: VehicleSpec): VehiclePath {
  const startDistance = vehicle.startDistance ?? DEFAULT_START_DISTANCE;
  const local = southFramePoints(vehicle.maneuver, startDistance);
  const abs = local.map((p) => fromSouthFrame(p, vehicle.approach));
  const samples: PathSample[] = [];
  let s = 0;
  for (let i = 0; i < abs.length; i++) {
    const p = abs[i]!;
    if (i > 0) {
      const q = abs[i - 1]!;
      s += Math.hypot(p.x - q.x, p.y - q.y);
    }
    const a = abs[Math.min(i + 1, abs.length - 1)]!;
    const b = abs[Math.max(i - 1, 0)]!;
    const angle = (Math.atan2(a.x - b.x, -(a.y - b.y)) * 180) / Math.PI;
    samples.push({ x: p.x, y: p.y, angle, s });
  }
  return {
    vehicleId: vehicle.id,
    samples,
    length: s,
    stopS: startDistance - (STOP_LINE + CAR_HALF_LENGTH + 2),
  };
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return a + d * t;
}

export function pointAt(path: VehiclePath, s: number): PathSample {
  const samples = path.samples;
  if (s <= 0) return samples[0]!;
  if (s >= path.length) return samples[samples.length - 1]!;
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid]!.s <= s) lo = mid;
    else hi = mid;
  }
  const a = samples[lo]!;
  const b = samples[hi]!;
  const t = b.s === a.s ? 0 : (s - a.s) / (b.s - a.s);
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    angle: lerpAngle(a.angle, b.angle, t),
    s,
  };
}

/** Sign position: on the driver's right, just before the stop line, facing the driver. */
export function signPlacement(arm: Arm): { x: number; y: number; rotation: number } {
  const p = fromSouthFrame({ x: HALF_ROAD + 28, y: STOP_LINE + 34 }, arm);
  return { ...p, rotation: approachAngle(arm) };
}

/** SVG path for a vehicle's full route, from its frozen position to `untilS`. */
export function pathToSvg(path: VehiclePath, fromS: number, untilS: number): string {
  const pts = path.samples.filter((p) => p.s >= fromS && p.s <= untilS);
  if (pts.length === 0) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

export const ARM_FROM_KA: Record<Arm, string> = {
  N: 'ჩრდილოეთიდან',
  E: 'აღმოსავლეთიდან',
  S: 'სამხრეთიდან',
  W: 'დასავლეთიდან',
};

export const ARM_TOWARD_KA: Record<Arm, string> = {
  N: 'ჩრდილოეთისკენ',
  E: 'აღმოსავლეთისკენ',
  S: 'სამხრეთისკენ',
  W: 'დასავლეთისკენ',
};

export const MANEUVER_KA: Record<Maneuver, string> = {
  straight: 'პირდაპირ გადის',
  left: 'მარცხნივ უხვევს',
  right: 'მარჯვნივ უხვევს',
};
