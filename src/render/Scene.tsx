import { useId } from 'react';
import type { Arm, Scenario, VehicleSpec } from '../content/types';
import {
  ARMS,
  CENTER,
  HALF_ROAD,
  STOP_LINE,
  fromSouthFrame,
  pathToSvg,
  signPlacement,
  type PathSample,
  type Point,
} from '../engine/geometry';
import type { ScenarioMotion } from '../engine/timeline';
import { SignFace } from './SignGraphic';
import { VehicleBody, shade } from './VehicleGraphic';

/**
 * How much of the explanation the scene may show.
 *  - none:    neutral scene only (independent exercises before submission)
 *  - context: decisive signs, main-road band and the key relationship (lessons, assisted guided)
 *  - full:    context plus who has priority and who yields (after submission)
 */
export type RevealLevel = 'none' | 'context' | 'full';

export interface SceneProps {
  scenario: Scenario;
  motion: ScenarioMotion;
  positions: Record<string, PathSample>;
  reveal: RevealLevel;
  showRelation: boolean;
  showConflictMarker: boolean;
  /** Fade route arrows while vehicles are moving. */
  routesFaded: boolean;
  title: string;
  description: string;
}

const VIEW = { x: 60, y: 60, w: 480, h: 480 };
const ROUTE_VISIBLE_RADIUS = 228;

export function Scene(props: SceneProps) {
  const { scenario, motion, positions, reveal } = props;
  const uid = useId().replace(/:/g, '');
  const titleId = `scene-title-${uid}`;
  const descId = `scene-desc-${uid}`;
  const decisive = new Set(reveal === 'none' ? [] : scenario.highlight.decisiveSignIds);

  return (
    <svg
      className="scene"
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>{props.title}</title>
      <desc id={descId}>{props.description}</desc>
      <defs>
        <filter id="car-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
        <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.25" />
        </filter>
        {scenario.vehicles.map((v) => (
          <marker
            key={v.id}
            id={`arrow-${uid}-${v.id}`}
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="4.2"
            markerHeight="4.2"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 Z" fill={routeColor(v)} />
          </marker>
        ))}
      </defs>

      <Ground />
      {reveal !== 'none' && scenario.roads.kind === 'main' && <MainRoadBand arms={scenario.roads.mainArms} />}
      <Markings scenario={scenario} />
      {scenario.vehicles.map((v) => (
        <Route key={v.id} vehicle={v} motion={motion} markerId={`arrow-${uid}-${v.id}`} faded={props.routesFaded} />
      ))}
      {scenario.signs.map((s) => {
        const p = signPlacement(s.arm);
        return (
          <g key={s.id} transform={`translate(${p.x} ${p.y}) rotate(${p.rotation})`}>
            {decisive.has(s.id) && <circle r={s.plateMainArms ? 38 : 26} cy={s.plateMainArms ? 14 : 0} className="sign-glow" />}
            <circle r={2.2} cy={s.plateMainArms ? 52 : 22} fill="#7b8087" />
            <g transform="scale(0.92)" filter="url(#soft-shadow)">
              <SignFace sign={s} />
            </g>
          </g>
        );
      })}
      {props.showConflictMarker && motion.conflict && <ConflictMarker at={motion.conflict.point} />}
      {reveal === 'full' &&
        scenario.vehicles.map((v) => {
          const p = positions[v.id];
          if (!p) return null;
          const isPriority = v.id === scenario.highlight.priorityVehicleId;
          return <circle key={v.id} cx={p.x} cy={p.y} r={31} className={isPriority ? 'ring-priority' : 'ring-yield'} />;
        })}
      {scenario.vehicles.map((v) => {
        const p = positions[v.id];
        if (!p) return null;
        return (
          <g key={v.id} transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`}>
            <g transform={`rotate(${p.angle.toFixed(2)})`}>
              <VehicleBody body={v.body} color={v.color} />
            </g>
            <circle r={10.5} fill="#ffffff" stroke="#1b2a36" strokeWidth={2} />
            <text className="vehicle-letter" y={0.5} textAnchor="middle" dominantBaseline="central">
              {v.label}
            </text>
          </g>
        );
      })}
      {props.showRelation && reveal !== 'none' && scenario.highlight.relation && (
        <RelationLine scenario={scenario} positions={positions} />
      )}
      {scenario.vehicles.map((v) => {
        const p = positions[v.id];
        if (!p) return null;
        // Status pills only while frozen; once moving, the rings carry the same meaning.
        const status =
          reveal === 'full' && p.s < 20
            ? v.id === scenario.highlight.priorityVehicleId
              ? { text: 'უპირატესობა', cls: 'pill-priority' }
              : { text: 'უთმობს გზას', cls: 'pill-yield' }
            : null;
        return <VehicleTags key={v.id} vehicle={v} at={p} status={status} />;
      })}
      <Compass />
      {scenario.roads.kind === 'equal' && <Pill x={VIEW.x + 12} y={VIEW.y + 20} text="თანაბარმნიშვნელოვანი გზები" cls="pill-info" anchor="start" />}
    </svg>
  );
}

/* ---------------- static layers ---------------- */

function Ground() {
  const r = 30;
  const near = CENTER.x - HALF_ROAD;
  const far = CENTER.x + HALF_ROAD;
  const big = 420;
  const blocks: Array<[number, number]> = [
    [near - big, near - big],
    [far, near - big],
    [near - big, far],
    [far, far],
  ];
  return (
    <g>
      <rect x={0} y={0} width={600} height={600} fill="var(--asphalt)" />
      {blocks.map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={big} height={big} rx={r} fill="var(--kerb)" />
          <rect x={x + 9} y={y + 9} width={big - 18} height={big - 18} rx={r - 8} fill="var(--verge)" />
        </g>
      ))}
    </g>
  );
}

function MainRoadBand({ arms }: { arms: [Arm, Arm] }) {
  const end = (arm: Arm) => fromSouthFrame({ x: 0, y: 260 }, arm);
  const a = end(arms[0]);
  const b = end(arms[1]);
  return (
    <path
      d={`M${a.x} ${a.y} L${CENTER.x} ${CENTER.y} L${b.x} ${b.y}`}
      fill="none"
      stroke="var(--main-band)"
      strokeWidth={HALF_ROAD * 2}
      strokeLinejoin="round"
      className="main-band"
    />
  );
}

function Markings({ scenario }: { scenario: Scenario }) {
  const yieldArms = new Set(scenario.signs.filter((s) => s.type === 'yield').map((s) => s.arm));
  return (
    <g>
      {ARMS.map((arm) => {
        const a = fromSouthFrame({ x: 0, y: HALF_ROAD + 22 }, arm);
        const b = fromSouthFrame({ x: 0, y: 300 }, arm);
        const s1 = fromSouthFrame({ x: 0, y: STOP_LINE }, arm);
        const s2 = fromSouthFrame({ x: HALF_ROAD - 2, y: STOP_LINE }, arm);
        return (
          <g key={arm}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="lane-dash" />
            {yieldArms.has(arm) && <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} className="giveway-line" />}
          </g>
        );
      })}
    </g>
  );
}

function routeColor(v: VehicleSpec): string {
  return shade(v.color, v.color.toLowerCase() === '#eeeae0' ? -0.55 : -0.15);
}

function Route({
  vehicle,
  motion,
  markerId,
  faded,
}: {
  vehicle: VehicleSpec;
  motion: ScenarioMotion;
  markerId: string;
  faded: boolean;
}) {
  const path = motion.paths[vehicle.id];
  if (!path) return null;
  const startS = 28;
  // stop where the route leaves the visible area
  let endS = path.length;
  for (const p of path.samples) {
    if (p.s > path.stopS && Math.hypot(p.x - CENTER.x, p.y - CENTER.y) > ROUTE_VISIBLE_RADIUS - 40) {
      endS = p.s;
      break;
    }
  }
  const d = pathToSvg(path, startS, endS);
  return (
    <g className={faded ? 'route route-faded' : 'route'}>
      <path d={d} className="route-casing" />
      <path d={d} className="route-line" stroke={routeColor(vehicle)} markerEnd={`url(#${markerId})`} />
    </g>
  );
}

function ConflictMarker({ at }: { at: Point }) {
  return (
    <g transform={`translate(${at.x} ${at.y})`} className="conflict-marker">
      <circle r={16} fill="#fff4d6" stroke="#b7791f" strokeWidth={3} />
      <path d="M0 -8 L0 2" stroke="#7a4d00" strokeWidth={3.4} strokeLinecap="round" />
      <circle cy={7} r={2.1} fill="#7a4d00" />
    </g>
  );
}

function RelationLine({ scenario, positions }: { scenario: Scenario; positions: Record<string, PathSample> }) {
  const rel = scenario.highlight.relation!;
  const a = positions[rel.fromVehicleId];
  const b = positions[rel.toVehicleId];
  if (!a || !b) return null;
  const va = scenario.vehicles.find((v) => v.id === rel.fromVehicleId)!;
  const vertical = (arm: Arm) => arm === 'N' || arm === 'S';
  const vb = scenario.vehicles.find((v) => v.id === rel.toVehicleId)!;
  // Curve along the roads: bend at the point where the two approach lines meet.
  let c: Point = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  if (vertical(va.approach) !== vertical(vb.approach)) {
    c = vertical(va.approach) ? { x: a.x, y: b.y } : { x: b.x, y: a.y };
  }
  const toward = (p: Point, q: Point, d: number): Point => {
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    return { x: p.x + ((q.x - p.x) / len) * d, y: p.y + ((q.y - p.y) / len) * d };
  };
  // shorten both ends so the arrow does not cover the cars
  const p0 = toward(a, c, 30);
  const p2 = toward(b, c, 36);
  const mx = 0.25 * p0.x + 0.5 * c.x + 0.25 * p2.x;
  const my = 0.25 * p0.y + 0.5 * c.y + 0.25 * p2.y;
  return (
    <g className="relation">
      <defs>
        <marker id="rel-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="#1d3b53" />
        </marker>
      </defs>
      <path
        d={`M${p0.x} ${p0.y} Q${c.x} ${c.y} ${p2.x} ${p2.y}`}
        fill="none"
        className="relation-line"
        markerEnd="url(#rel-arrow)"
      />
      <Pill x={mx} y={my} text={rel.labelKa} cls="pill-relation" anchor="middle" />
    </g>
  );
}

/* ---------------- labels ---------------- */

const TAG_FONT = 12;

function textWidth(text: string, size: number): number {
  // Georgian glyphs in Noto Sans Georgian average ≈0.62em.
  return text.length * size * 0.6;
}

function Pill({ x, y, text, cls, anchor }: { x: number; y: number; text: string; cls: string; anchor: 'start' | 'middle' }) {
  const w = textWidth(text, TAG_FONT) + 14;
  const h = 20;
  const raw = anchor === 'middle' ? x - w / 2 : x;
  // keep every label fully inside the visible scene
  const left = Math.max(VIEW.x + 4, Math.min(raw, VIEW.x + VIEW.w - 4 - w));
  y = Math.max(VIEW.y + h / 2 + 2, Math.min(y, VIEW.y + VIEW.h - h / 2 - 2));
  return (
    <g className={`pill ${cls}`}>
      <rect x={left} y={y - h / 2} width={w} height={h} rx={h / 2} />
      <text x={left + w / 2} y={y + 0.5} textAnchor="middle" dominantBaseline="central">
        {text}
      </text>
    </g>
  );
}

/**
 * Tags sit behind the car (vertical approaches) or on the kerb side and a
 * little behind it (horizontal approaches), so they never cover the junction
 * or the sign plates.
 */
function tagOffset(approach: Arm): { dx: number; dy: number; bx: number } {
  switch (approach) {
    case 'S':
      return { dx: 0, dy: 1, bx: -22 };
    case 'N':
      return { dx: 0, dy: -1, bx: 22 };
    case 'W':
      return { dx: 0, dy: 1, bx: -22 };
    case 'E':
      return { dx: 0, dy: -1, bx: 22 };
  }
}

function VehicleTags({
  vehicle,
  at,
  status,
}: {
  vehicle: VehicleSpec;
  at: PathSample;
  status: { text: string; cls: string } | null;
}) {
  const o = tagOffset(vehicle.approach);
  const vertical = vehicle.approach === 'N' || vehicle.approach === 'S';
  const first = vertical ? 40 : 34;
  const lines: Array<{ text: string; cls: string }> = [];
  if (vehicle.isLearner) lines.push({ text: 'შენი ავტომობილი', cls: 'pill-learner' });
  if (status) lines.push(status);
  return (
    <g>
      {lines.map((l, i) => (
        <Pill
          key={l.text}
          x={at.x + o.bx + o.dx * (first + i * 23)}
          y={at.y + o.dy * (first + i * 23)}
          text={l.text}
          cls={l.cls}
          anchor="middle"
        />
      ))}
    </g>
  );
}

function Compass() {
  const x = VIEW.x + VIEW.w - 26;
  const y = VIEW.y + 30;
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <circle r={17} fill="#ffffff" opacity={0.92} />
      <path d="M0 -12 L5 2 L0 -1 L-5 2 Z" fill="#1d3b53" />
      <text y={10} textAnchor="middle" className="compass-text">
        ჩ
      </text>
    </g>
  );
}
