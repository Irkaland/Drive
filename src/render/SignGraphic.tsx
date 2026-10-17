import type { Arm, SignSpec } from '../content/types';
import { plateDirection } from '../engine/geometry';

/**
 * Upright sign face in local coordinates, centred on (0, 0). The driver who
 * reads it is below (+y). Shapes, colours and proportions follow the images in
 * the law's sign annex (danarti 1-5, matsne.gov.ge, publication of 25/06/2026):
 *  - 2.1 „მთავარი გზა“ — white diamond with a dark edge and a black-outlined
 *    yellow inner diamond (≈ 0.6 of the outer size), rounded corners;
 *  - 2.3 „დაუთმე გზა“ — white equilateral triangle, point down, with a red
 *    border ≈ 1/16 of the side and a thin white rim and dark edge outside it;
 *  - 8.13 „მთავარი გზის მიმართულება“ — square white plate hung below the sign,
 *    drawn from the reading driver's point of view (see DirectionPlate).
 * Colours are those of the annex images.
 */
export function SignFace({ sign }: { sign: SignSpec }) {
  return (
    <g>
      {sign.type === 'main_road' ? <MainRoadFace /> : <YieldFace />}
      {sign.plateMainArms && <DirectionPlate driverArm={sign.arm} mainArms={sign.plateMainArms} />}
    </g>
  );
}

const INK = '#1b1e21';
const SIGN_YELLOW = '#ffe500';
const SIGN_RED = '#ff0000';

/**
 * Regular polygon with inradius `rho` and corners rounded to radius `r`: the
 * polygon inset by `r`, filled and stroked with a round join of width 2r.
 * `startDeg` is the angle of the first vertex (0° = +x, 90° = +y / down).
 */
function RoundedPolygon({ sides, rho, r, startDeg, cy = 0, fill }: {
  sides: number;
  rho: number;
  r: number;
  startDeg: number;
  cy?: number;
  fill: string;
}) {
  const R = (rho - r) / Math.cos(Math.PI / sides);
  const points = Array.from({ length: sides }, (_, k) => {
    const a = ((startDeg + (k * 360) / sides) * Math.PI) / 180;
    return `${(R * Math.cos(a)).toFixed(2)},${(cy + R * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return <polygon points={points} fill={fill} stroke={fill} strokeWidth={2 * r} strokeLinejoin="round" />;
}

/** 2.1: outer half-diagonal 16; yellow fill ≈ 0.59 of it, inside a black outline. */
export function MainRoadFace() {
  const diamond = { sides: 4, startDeg: 0 };
  return (
    <g>
      <RoundedPolygon {...diamond} rho={11.31} r={1.9} fill={INK} />
      <RoundedPolygon {...diamond} rho={10.71} r={1.3} fill="#ffffff" />
      <RoundedPolygon {...diamond} rho={7.25} r={1.5} fill={INK} />
      <RoundedPolygon {...diamond} rho={6.7} r={1.1} fill={SIGN_YELLOW} />
    </g>
  );
}

/** 2.3: side ≈ 34.6 (inradius 10), centroid at y = -4, so the face spans y -14…16. */
function YieldFace() {
  const tri = { sides: 3, startDeg: 90, cy: -4 };
  return (
    <g>
      <RoundedPolygon {...tri} rho={10} r={1} fill={INK} />
      <RoundedPolygon {...tri} rho={9.7} r={0.8} fill="#ffffff" />
      <RoundedPolygon {...tri} rho={9.4} r={0.6} fill={SIGN_RED} />
      <RoundedPolygon {...tri} rho={7.4} r={0.3} fill="#ffffff" />
    </g>
  );
}

const PLATE_HALF = 12;
const PLATE_BORDER = 0.6;
/** Annex 8.13: thick band ≈ 10 % of the plate side, thin lines ≈ 3 %. */
const THICK = 2.4;
const THIN = 0.8;
/** Centre-line radius of the bend in the thick band (≈ 0.13 of the side). */
const BEND = 3.1;

const PLATE_DIR: Record<'bottom' | 'top' | 'left' | 'right', [number, number]> = {
  bottom: [0, 1],
  top: [0, -1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * 8.13 as in the annex: a square plate whose lines lie on its centre axes and
 * run to the border. The main road is one thick band with butt ends and a
 * rounded bend; the other roads are thin lines that stop at the edge of the
 * thick band. The reading driver's own approach is at the bottom.
 */
function DirectionPlate({ driverArm, mainArms }: { driverArm: Arm; mainArms: [Arm, Arm] }) {
  const arms: Arm[] = ['N', 'E', 'S', 'W'];
  const cy = 31;
  const end = PLATE_HALF - PLATE_BORDER / 2;
  const a = PLATE_DIR[plateDirection(driverArm, mainArms[0])];
  const b = PLATE_DIR[plateDirection(driverArm, mainArms[1])];
  const at = (d: [number, number], k: number) => `${d[0] * k} ${d[1] * k}`;
  const straight = a[0] === -b[0] && a[1] === -b[1];
  const k = 0.5523 * BEND;
  const mainPath = straight
    ? `M${at(a, end)} L${at(b, end)}`
    : `M${at(a, end)} L${at(a, BEND)} C${at(a, BEND - k)} ${at(b, BEND - k)} ${at(b, BEND)} L${at(b, end)}`;
  return (
    <g transform={`translate(0 ${cy})`}>
      <rect x={-PLATE_HALF} y={-PLATE_HALF} width={2 * PLATE_HALF} height={2 * PLATE_HALF} rx={1.3} fill="#ffffff" />
      {arms
        .filter((arm) => !mainArms.includes(arm))
        .map((arm) => {
          const d = PLATE_DIR[plateDirection(driverArm, arm)];
          return (
            <line
              key={arm}
              x1={d[0] * (THICK / 2)}
              y1={d[1] * (THICK / 2)}
              x2={d[0] * end}
              y2={d[1] * end}
              stroke={INK}
              strokeWidth={THIN}
            />
          );
        })}
      <path d={mainPath} fill="none" stroke={INK} strokeWidth={THICK} strokeLinecap="butt" />
      <rect
        x={-PLATE_HALF + PLATE_BORDER / 2}
        y={-PLATE_HALF + PLATE_BORDER / 2}
        width={2 * PLATE_HALF - PLATE_BORDER}
        height={2 * PLATE_HALF - PLATE_BORDER}
        rx={1}
        fill="none"
        stroke={INK}
        strokeWidth={PLATE_BORDER}
      />
    </g>
  );
}

/** Official names and catalogue numbers from the law's sign annex (danarti 1-5). */
export const SIGN_NAME_KA: Record<SignSpec['type'], string> = {
  main_road: '2.1 „მთავარი გზა“',
  yield: '2.3 „დაუთმე გზა“',
};

export const PLATE_NAME_KA = '8.13 „მთავარი გზის მიმართულება“';
