import type { Scenario } from '../content/types';
import { ARM_FROM_KA } from '../engine/geometry';
import { PLATE_NAME_KA, SIGN_NAME_KA, SignFace } from './SignGraphic';

/**
 * Enlarged, upright copies of the signs each driver sees. This is a reading
 * aid for the top-down view — not additional road signs.
 */
export function SignInset({ scenario, emphasize }: { scenario: Scenario; emphasize: boolean }) {
  if (scenario.signs.length === 0) return null;
  const decisive = new Set(emphasize ? scenario.highlight.decisiveSignIds : []);
  const ordered = [...scenario.signs].sort((a, b) => viewerRank(scenario, a.arm) - viewerRank(scenario, b.arm));
  return (
    <figure className="sign-inset">
      <figcaption>ნიშნები გადიდებით — ისე, როგორც მძღოლი ხედავს</figcaption>
      <ul>
        {ordered.map((s) => {
          const viewer = scenario.vehicles.find((v) => v.approach === s.arm);
          const who = viewer ? (viewer.isLearner ? `შენ (${viewer.label}) ხედავ` : `${viewer.label} ხედავს`) : 'სხვა შესასვლელი';
          return (
            <li key={s.id} className={decisive.has(s.id) ? 'is-decisive' : undefined}>
              <svg viewBox={s.plateMainArms ? '-22 -22 44 70' : '-22 -22 44 44'} aria-hidden="true" className="inset-sign">
                <SignFace sign={s} />
              </svg>
              <span className="inset-text">
                <strong>{who}</strong>
                <span>
                  {ARM_FROM_KA[s.arm]} · {SIGN_NAME_KA[s.type]}
                  {s.plateMainArms ? ` + დაფა ${PLATE_NAME_KA}` : ''}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

function viewerRank(scenario: Scenario, arm: string): number {
  const v = scenario.vehicles.find((x) => x.approach === arm);
  if (!v) return 3;
  return v.isLearner ? 0 : 1;
}
