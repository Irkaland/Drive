import type { BodyStyle } from '../content/types';

/** Shade a #rrggbb colour toward black (amount < 0) or white (amount > 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const target = amount < 0 ? 0 : 255;
    return Math.round(c + (target - c) * Math.abs(amount));
  });
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

const DIMENSIONS: Record<BodyStyle, { len: number; wid: number }> = {
  sedan: { len: 46, wid: 24 },
  hatch: { len: 41, wid: 24 },
  suv: { len: 48, wid: 26 },
};

/**
 * Top-down passenger car pointing up (front at −y), centred on (0, 0).
 * The same illustration family is used for every vehicle; only body style
 * and paint vary.
 */
export function VehicleBody({ body, color }: { body: BodyStyle; color: string }) {
  const { len, wid } = DIMENSIONS[body];
  const hl = len / 2;
  const hw = wid / 2;
  const glass = '#25323d';
  const edge = shade(color, -0.35);
  const roof = shade(color, 0.12);
  const windshieldTop = -hl + (body === 'suv' ? 11 : 12);
  const windshieldBottom = windshieldTop + 7;
  const rearTop = body === 'hatch' ? hl - 9 : hl - 11;
  const rearBottom = body === 'hatch' ? hl - 4 : hl - 5;
  return (
    <g>
      <rect x={-hw + 1.5} y={-hl + 3} width={wid} height={len} rx={7} fill="#000" opacity={0.22} filter="url(#car-shadow)" />
      {/* mirrors */}
      <rect x={-hw - 2.5} y={windshieldTop + 1} width={3.5} height={4.5} rx={1.2} fill={edge} />
      <rect x={hw - 1} y={windshieldTop + 1} width={3.5} height={4.5} rx={1.2} fill={edge} />
      <rect x={-hw} y={-hl} width={wid} height={len} rx={body === 'suv' ? 6 : 7.5} fill={color} stroke={edge} strokeWidth={1} />
      {/* bonnet sheen */}
      <rect x={-hw + 3} y={-hl + 2.5} width={wid - 6} height={windshieldTop + hl - 4} rx={3} fill="#ffffff" opacity={0.13} />
      {/* windscreen */}
      <path
        d={`M${-hw + 2.5} ${windshieldTop} Q0 ${windshieldTop - 3} ${hw - 2.5} ${windshieldTop} L${hw - 4} ${windshieldBottom} L${-hw + 4} ${windshieldBottom} Z`}
        fill={glass}
      />
      {/* roof */}
      <rect x={-hw + 4} y={windshieldBottom} width={wid - 8} height={rearTop - windshieldBottom} rx={3} fill={roof} />
      {body === 'suv' && (
        <g stroke={shade(color, -0.45)} strokeWidth={1.2} strokeLinecap="round">
          <line x1={-hw + 5.5} y1={windshieldBottom + 2} x2={-hw + 5.5} y2={rearTop - 2} />
          <line x1={hw - 5.5} y1={windshieldBottom + 2} x2={hw - 5.5} y2={rearTop - 2} />
        </g>
      )}
      {/* rear window */}
      <path d={`M${-hw + 4} ${rearTop} L${hw - 4} ${rearTop} L${hw - 3} ${rearBottom} Q0 ${rearBottom + 2} ${-hw + 3} ${rearBottom} Z`} fill={glass} />
      {/* lights */}
      <rect x={-hw + 2} y={-hl + 0.6} width={5.5} height={2.6} rx={1.2} fill="#fff6cf" />
      <rect x={hw - 7.5} y={-hl + 0.6} width={5.5} height={2.6} rx={1.2} fill="#fff6cf" />
      <rect x={-hw + 2} y={hl - 3} width={5} height={2.4} rx={1} fill="#b3261e" />
      <rect x={hw - 7} y={hl - 3} width={5} height={2.4} rx={1} fill="#b3261e" />
    </g>
  );
}

export function vehicleHalfLength(body: BodyStyle): number {
  return DIMENSIONS[body].len / 2;
}
