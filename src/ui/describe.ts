import type { Scenario, SignSpec, VehicleSpec } from '../content/types';
import { ARM_FROM_KA, ARM_TOWARD_KA, exitArm, plateDirection } from '../engine/geometry';
import { PLATE_NAME_KA, SIGN_NAME_KA } from '../render/SignGraphic';

/** Text equivalents of the scene — available with or without animation. */

export function vehicleName(v: VehicleSpec): string {
  return v.isLearner ? `შენი ავტომობილი (${v.label})` : `ავტომობილი ${v.label}`;
}

const MOVE_KA = {
  straight: 'პირდაპირ მიდის',
  left: 'მარცხნივ უხვევს',
  right: 'მარჯვნივ უხვევს',
} as const;

export function describeVehicle(v: VehicleSpec): string {
  return `${vehicleName(v)}, ${v.appearanceKa}: მოდის ${ARM_FROM_KA[v.approach]} და ${MOVE_KA[v.maneuver]} ${ARM_TOWARD_KA[exitArm(v.approach, v.maneuver)]}.`;
}

const PLATE_SIDE_KA = { left: 'მარცხნივ', right: 'მარჯვნივ', top: 'პირდაპირ', bottom: 'უკან' } as const;

export function describeSign(s: SignSpec): string {
  const where = `${ARM_FROM_KA[s.arm]} შემოსასვლელთან`;
  let text = `${where}: ნიშანი ${SIGN_NAME_KA[s.type]}`;
  if (s.plateMainArms) {
    const other = s.plateMainArms.find((a) => a !== s.arm) ?? s.plateMainArms[0];
    if (s.plateMainArms.includes(s.arm)) {
      text += `, დაფით ${PLATE_NAME_KA}: მთავარი გზა ამ მძღოლისთვის ${PLATE_SIDE_KA[plateDirection(s.arm, other)]} უხვევს`;
    } else {
      const [a, b] = s.plateMainArms.map((x) => PLATE_SIDE_KA[plateDirection(s.arm, x)]);
      text += `, დაფით ${PLATE_NAME_KA}: მთავარი გზა ამ მძღოლისთვის ${a} და ${b} მიმართულებებს აერთებს`;
    }
  }
  return `${text}.`;
}

export function describeScene(s: Scenario): string {
  const parts = s.vehicles.map(describeVehicle);
  if (s.roads.kind === 'equal') parts.push('გზები თანაბარმნიშვნელოვანია, პრიორიტეტის ნიშნები არ არის.');
  else parts.push(...s.signs.map(describeSign));
  return parts.join(' ');
}
