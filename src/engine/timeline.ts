import type { Scenario, VehicleSpec } from '../content/types';
import { buildPath, pointAt, type PathSample, type Point, type VehiclePath } from './geometry';

/**
 * Deterministic, hand-rolled animation timelines. A timeline is pure data:
 * for each vehicle, keyframes of (time, distance-along-path). Sampling the
 * same timeline at the same time always yields the same positions, so replay,
 * pause and step-by-step never depend on frame rate.
 */

export const SPEED = 125; // scene units per second (average)
export const LEAD_IN = 0.5; // seconds before anything moves
export const CONFLICT_RADIUS = 50; // centre-to-path distance that counts as "in the conflict zone"
const CAR_HALF_LEN = 23;
const CAR_HALF_WID = 12;
const SAFETY_MARGIN = 6;

export interface Keyframe {
  t: number;
  s: number;
}

export interface Track {
  vehicleId: string;
  keys: Keyframe[];
}

export interface TimelineStep {
  t: number;
  captionKa: string;
}

export interface Timeline {
  kind: 'correct' | 'proposal';
  optionId?: string;
  duration: number;
  tracks: Track[];
  steps: TimelineStep[];
  /** Conflict marker shown from this time on (proposal previews only). */
  conflictMarkerFrom?: number;
}

export interface ConflictInfo {
  a: string;
  b: string;
  /** Range of distances along each path that lies inside the other path's conflict zone. */
  zones: Record<string, [number, number]>;
  /** Where the paths first meet (crossing point or merge point). */
  point: Point;
}

/* ---------------- paths and conflicts ---------------- */

export function buildPaths(scenario: Scenario): Record<string, VehiclePath> {
  return Object.fromEntries(scenario.vehicles.map((v) => [v.id, buildPath(v)]));
}

function minDistToPath(p: Point, path: VehiclePath): number {
  let best = Infinity;
  const samples = path.samples;
  for (let i = 0; i < samples.length; i += 2) {
    const q = samples[i]!;
    const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

function zoneOf(path: VehiclePath, other: VehiclePath): [number, number] | null {
  let first = -1;
  let last = -1;
  for (const p of path.samples) {
    if (minDistToPath(p, other) < CONFLICT_RADIUS) {
      if (first < 0) first = p.s;
      last = p.s;
    }
  }
  return first < 0 ? null : [first, last];
}

export function analyzeConflict(pa: VehiclePath, pb: VehiclePath): ConflictInfo | null {
  const za = zoneOf(pa, pb);
  const zb = zoneOf(pb, pa);
  if (!za || !zb) return null;
  // Meeting point: first sample of A that (nearly) touches B's path.
  let point: Point | null = null;
  let best = Infinity;
  let bestPoint: Point = pa.samples[0]!;
  for (const p of pa.samples) {
    const d = minDistToPath(p, pb);
    if (d < 6) {
      point = { x: p.x, y: p.y };
      break;
    }
    if (d < best) {
      best = d;
      bestPoint = { x: p.x, y: p.y };
    }
  }
  return { a: pa.vehicleId, b: pb.vehicleId, zones: { [pa.vehicleId]: za, [pb.vehicleId]: zb }, point: point ?? bestPoint };
}

/* ---------------- sampling ---------------- */

function smoothstep(u: number): number {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
}

export function sampleTrack(track: Track, t: number): number {
  const keys = track.keys;
  if (keys.length === 0) return 0;
  if (t <= keys[0]!.t) return keys[0]!.s;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]!;
    const b = keys[i + 1]!;
    if (t <= b.t) {
      if (b.t === a.t) return b.s;
      return a.s + (b.s - a.s) * smoothstep((t - a.t) / (b.t - a.t));
    }
  }
  return keys[keys.length - 1]!.s;
}

export function sampleTimeline(
  timeline: Timeline,
  paths: Record<string, VehiclePath>,
  t: number,
): Record<string, PathSample> {
  const out: Record<string, PathSample> = {};
  for (const track of timeline.tracks) {
    const path = paths[track.vehicleId];
    if (path) out[track.vehicleId] = pointAt(path, sampleTrack(track, t));
  }
  return out;
}

/** Frozen approach positions (s = 0 for every vehicle). */
export function frozenPositions(paths: Record<string, VehiclePath>): Record<string, PathSample> {
  return Object.fromEntries(Object.entries(paths).map(([id, p]) => [id, pointAt(p, 0)]));
}

/** Index of the step whose time is the latest one ≤ t. */
export function stepIndexAt(timeline: Timeline, t: number): number {
  let idx = 0;
  timeline.steps.forEach((s, i) => {
    if (s.t <= t + 1e-6) idx = i;
  });
  return idx;
}

/* ---------------- collision check (oriented rectangles) ---------------- */

function corners(p: PathSample, margin: number): Point[] {
  const r = (p.angle * Math.PI) / 180;
  const fx = Math.sin(r);
  const fy = -Math.cos(r); // forward vector
  const rx = -fy;
  const ry = fx; // right vector
  const hl = CAR_HALF_LEN + margin;
  const hw = CAR_HALF_WID + margin;
  return [
    { x: p.x + fx * hl + rx * hw, y: p.y + fy * hl + ry * hw },
    { x: p.x + fx * hl - rx * hw, y: p.y + fy * hl - ry * hw },
    { x: p.x - fx * hl - rx * hw, y: p.y - fy * hl - ry * hw },
    { x: p.x - fx * hl + rx * hw, y: p.y - fy * hl + ry * hw },
  ];
}

function projectRange(pts: Point[], ax: Point): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of pts) {
    const v = p.x * ax.x + p.y * ax.y;
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return [lo, hi];
}

/** True when two vehicle bodies (plus a safety margin each) overlap. */
export function vehiclesOverlap(a: PathSample, b: PathSample, margin = SAFETY_MARGIN / 2): boolean {
  const ca = corners(a, margin);
  const cb = corners(b, margin);
  for (const poly of [ca, cb]) {
    for (let i = 0; i < 2; i++) {
      const p = poly[i]!;
      const q = poly[i + 1]!;
      const axis = { x: -(q.y - p.y), y: q.x - p.x };
      const [a0, a1] = projectRange(ca, axis);
      const [b0, b1] = projectRange(cb, axis);
      if (a1 < b0 || b1 < a0) return false;
    }
  }
  return true;
}

/** Scan a timeline for any moment where two vehicles overlap. */
export function findOverlap(
  timeline: Timeline,
  paths: Record<string, VehiclePath>,
  margin?: number,
  dt = 1 / 60,
): number | null {
  for (let t = 0; t <= timeline.duration + 1e-9; t += dt) {
    // Vehicles that reached their path end have left the scene and no longer count.
    const pos = Object.entries(sampleTimeline(timeline, paths, t))
      .filter(([id, p]) => p.s < paths[id]!.length - 0.5)
      .map(([, p]) => p);
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        if (vehiclesOverlap(pos[i]!, pos[j]!, margin)) return t;
      }
    }
  }
  return null;
}

/* ---------------- builders ---------------- */

function vehicle(scenario: Scenario, id: string): VehicleSpec {
  const v = scenario.vehicles.find((x) => x.id === id);
  if (!v) throw new Error(`Unknown vehicle ${id}`);
  return v;
}

function moveDuration(distance: number): number {
  return Math.max(0.9, distance / SPEED);
}

/**
 * Correct movement: the priority vehicle drives through; the yielding vehicle
 * stops at its line and starts only when the whole remaining replay is
 * collision-free (searched deterministically in 0.1 s steps).
 */
export function buildCorrectTimeline(scenario: Scenario, paths: Record<string, VehiclePath>): Timeline {
  const P = vehicle(scenario, scenario.highlight.priorityVehicleId);
  const Y = vehicle(scenario, scenario.highlight.yieldingVehicleId);
  const pp = paths[P.id]!;
  const py = paths[Y.id]!;
  const conflict = analyzeConflict(pp, py);

  const pEnd = LEAD_IN + moveDuration(pp.length);
  const stopAt = LEAD_IN + Math.max(1.1, moveDuration(py.stopS) * 1.3);
  const pTrack: Track = { vehicleId: P.id, keys: [{ t: 0, s: 0 }, { t: LEAD_IN, s: 0 }, { t: pEnd, s: pp.length }] };

  const yTrackFor = (tGo: number): Track => ({
    vehicleId: Y.id,
    keys: [
      { t: 0, s: 0 },
      { t: LEAD_IN, s: 0 },
      { t: stopAt, s: py.stopS },
      { t: tGo, s: py.stopS },
      { t: tGo + moveDuration(py.length - py.stopS) * 1.1, s: py.length },
    ],
  });

  let tGo = stopAt + 0.4;
  let timeline: Timeline | null = null;
  for (let guard = 0; guard < 200; guard++, tGo += 0.1) {
    const yTrack = yTrackFor(tGo);
    const duration = Math.max(pEnd, yTrack.keys[yTrack.keys.length - 1]!.t);
    const candidate: Timeline = { kind: 'correct', duration, tracks: [pTrack, yTrack], steps: [] };
    if (findOverlap(candidate, paths, undefined, 1 / 30) === null) {
      timeline = candidate;
      break;
    }
  }
  if (!timeline) throw new Error(`No safe correct timeline for ${scenario.id}`);
  // A short comfort gap after the first safe moment keeps the replay calm.
  tGo += 0.3;
  const yTrack = yTrackFor(tGo);
  const duration = Math.max(pEnd, yTrack.keys[yTrack.keys.length - 1]!.t);

  // Time at which P passes the meeting point (for the step caption).
  const meetS = conflict ? nearestS(pp, conflict.point) : pp.length / 2;
  const pPass = Math.min(tGo - 0.05, Math.max(stopAt + 0.05, timeAtS(pTrack, meetS + 30)));

  const meetY = conflict ? nearestS(py, conflict.point) : py.length / 2;
  const yPass = Math.min(duration - 0.05, Math.max(tGo + 0.05, timeAtS(yTrack, meetY + 30)));

  const learnerYields = Y.isLearner;
  const steps: TimelineStep[] = [
    { t: 0, captionKa: 'საწყისი მდგომარეობა: ორივე ავტომობილი გზაჯვარედინს უახლოვდება.' },
    {
      t: stopAt,
      captionKa: learnerYields ? `შენ (${Y.label}) ჩერდები და გზას უთმობ ${P.label}-ს.` : `${Y.label} ჩერდება და გზას გითმობს.`,
    },
    { t: pPass, captionKa: P.isLearner ? `შენ (${P.label}) გადიხარ გზაჯვარედინს.` : `${P.label} გადის გზაჯვარედინს.` },
    {
      t: tGo,
      captionKa: learnerYields ? 'გზა თავისუფალია — ახლა შენ აგრძელებ მოძრაობას.' : `გზა თავისუფალია — ახლა ${Y.label} აგრძელებს მოძრაობას.`,
    },
    { t: yPass, captionKa: learnerYields ? `შენ (${Y.label}) გადიხარ გზაჯვარედინს.` : `${Y.label} გადის გზაჯვარედინს.` },
    { t: duration, captionKa: 'ორივე ავტომობილმა უსაფრთხოდ გაიარა გზაჯვარედინი.' },
  ];
  return { kind: 'correct', duration, tracks: [pTrack, yTrack], steps };
}

/**
 * Preview of an incorrect proposal: the vehicles move as the learner proposed
 * and both stop just before their conflict zones. Nothing collides; the marker
 * shows where the paths would meet.
 */
export function buildProposalTimeline(
  scenario: Scenario,
  paths: Record<string, VehiclePath>,
  optionId: string,
): Timeline {
  const option = scenario.options.find((o) => o.id === optionId);
  if (!option) throw new Error(`Unknown option ${optionId}`);
  const P = vehicle(scenario, scenario.highlight.priorityVehicleId);
  const Y = vehicle(scenario, scenario.highlight.yieldingVehicleId);
  const conflict = analyzeConflict(paths[P.id]!, paths[Y.id]!);
  if (!conflict) throw new Error(`Scenario ${scenario.id} has no conflict to preview`);

  const stopBefore = (id: string) => Math.max(0, conflict.zones[id]![0] - 4);
  const sP = stopBefore(P.id);
  const sY = stopBefore(Y.id);
  const T = Math.max(1.4, moveDuration(Math.max(sP, sY)) * 1.35);
  const end = LEAD_IN + T;
  const tracks: Track[] = [P, Y].map((v) => ({
    vehicleId: v.id,
    keys: [
      { t: 0, s: 0 },
      { t: LEAD_IN, s: 0 },
      { t: end, s: v.id === P.id ? sP : sY },
    ],
  }));
  const duration = end + 0.8;

  let first: string;
  let last: string;
  if (option.kind === 'simultaneous') {
    first = 'შენი ვარიანტი: ორივე ავტომობილი ერთდროულად მოძრაობს.';
    last = 'ტრაექტორიები ერთმანეთს ხვდება — ერთ-ერთს უეცარი დამუხრუჭება მოუწევდა. ანიმაცია კონფლიქტამდე ჩერდება.';
  } else {
    const W = vehicle(scenario, option.vehicleId);
    first = W.isLearner ? `შენი ვარიანტი: შენ (${W.label}) გადიხარ პირველი.` : `შენი ვარიანტი: ${W.label} გადის პირველი.`;
    last = P.isLearner
      ? `უპირატესობა შენ გაქვს, მაგრამ ${W.label} არ გითმობს. ორივე ერთსა და იმავე ადგილს უახლოვდებით — შენ მოგიწევდა უეცარი დამუხრუჭება. ანიმაცია კონფლიქტამდე ჩერდება.`
      : `უპირატესობა ${P.label}-ს აქვს. ორივე ერთსა და იმავე ადგილს უახლოვდებით — ${P.label}-ს უეცარი დამუხრუჭება მოუწევდა. ანიმაცია კონფლიქტამდე ჩერდება.`;
  }
  return {
    kind: 'proposal',
    optionId,
    duration,
    tracks,
    conflictMarkerFrom: end - 0.3,
    steps: [
      { t: 0, captionKa: first },
      { t: LEAD_IN + T / 2, captionKa: 'ორივე ავტომობილი გზაჯვარედინს უახლოვდება.' },
      { t: end, captionKa: last },
    ],
  };
}

function nearestS(path: VehiclePath, p: Point): number {
  let best = Infinity;
  let s = 0;
  for (const q of path.samples) {
    const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
    if (d < best) {
      best = d;
      s = q.s;
    }
  }
  return s;
}

/** Earliest time at which a track reaches distance s (binary search on the eased curve). */
export function timeAtS(track: Track, s: number): number {
  const keys = track.keys;
  const end = keys[keys.length - 1]!.t;
  if (sampleTrack(track, end) < s) return end;
  let lo = 0;
  let hi = end;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (sampleTrack(track, mid) >= s) hi = mid;
    else lo = mid;
  }
  return hi;
}

export interface ScenarioMotion {
  paths: Record<string, VehiclePath>;
  conflict: ConflictInfo | null;
  correct: Timeline;
  proposals: Record<string, Timeline>;
}

/** Everything the renderer needs to animate one scenario, computed once. */
export function buildScenarioMotion(scenario: Scenario): ScenarioMotion {
  const paths = buildPaths(scenario);
  const P = scenario.highlight.priorityVehicleId;
  const Y = scenario.highlight.yieldingVehicleId;
  const conflict = analyzeConflict(paths[P]!, paths[Y]!);
  const proposals: Record<string, Timeline> = {};
  for (const o of scenario.options) {
    if (o.id !== scenario.correctOptionId) proposals[o.id] = buildProposalTimeline(scenario, paths, o.id);
  }
  return { paths, conflict, correct: buildCorrectTimeline(scenario, paths), proposals };
}
