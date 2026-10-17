import type { ChapterManifest, Scenario } from './types';
import { ARMS, areOpposite } from '../engine/geometry';

/**
 * Structural validation of hand-authored content. It proves internal
 * consistency (references, coverage, sign placement) — not legal correctness.
 */
export function validateScenario(s: Scenario): string[] {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`${s.id}: ${m}`);
  const vehicleIds = new Set(s.vehicles.map((v) => v.id));

  if (vehicleIds.size !== s.vehicles.length) err('duplicate vehicle ids');
  if (s.vehicles.length < 2 || s.vehicles.length > 3) err('scenarios must have 2–3 vehicles');
  const learners = s.vehicles.filter((v) => v.isLearner);
  if (learners.length !== 1) err('exactly one learner vehicle is required');
  const approaches = new Set(s.vehicles.map((v) => v.approach));
  if (approaches.size !== s.vehicles.length) err('each vehicle needs its own approach arm');
  for (const v of s.vehicles) {
    if (!v.label.trim()) err(`vehicle ${v.id} has no label`);
    const d = v.startDistance;
    if (d !== undefined && (d < 120 || d > 200)) err(`vehicle ${v.id} startDistance out of readable range`);
  }

  const optionIds = new Set(s.options.map((o) => o.id));
  if (optionIds.size !== s.options.length) err('duplicate option ids');
  if (s.options.length < 2) err('at least two options are required');
  for (const o of s.options) {
    if (o.kind === 'vehicle_first' && !vehicleIds.has(o.vehicleId)) err(`option ${o.id} references unknown vehicle ${o.vehicleId}`);
    if (!o.labelKa.trim()) err(`option ${o.id} has no label`);
    const e = s.explanationsByOption[o.id];
    if (!e || !e.titleKa.trim() || !e.bodyKa.trim()) err(`option ${o.id} has no explanation`);
  }
  for (const key of Object.keys(s.explanationsByOption)) {
    if (!optionIds.has(key)) err(`explanation for unknown option ${key}`);
  }
  const bodies = s.options.map((o) => s.explanationsByOption[o.id]?.bodyKa);
  if (new Set(bodies).size !== bodies.length) err('option explanations must be distinct');

  const correct = s.options.find((o) => o.id === s.correctOptionId);
  if (!correct) err(`correctOptionId ${s.correctOptionId} is not an option`);

  const h = s.highlight;
  if (!vehicleIds.has(h.priorityVehicleId)) err('highlight.priorityVehicleId unknown');
  if (!vehicleIds.has(h.yieldingVehicleId)) err('highlight.yieldingVehicleId unknown');
  if (h.priorityVehicleId === h.yieldingVehicleId) err('priority and yielding vehicle must differ');
  if (correct?.kind === 'vehicle_first' && correct.vehicleId !== h.priorityVehicleId) {
    err('correct option and highlighted priority vehicle disagree');
  }
  if (h.relation) {
    if (!vehicleIds.has(h.relation.fromVehicleId) || !vehicleIds.has(h.relation.toVehicleId)) err('relation references unknown vehicle');
  }
  const signIds = new Set(s.signs.map((g) => g.id));
  if (signIds.size !== s.signs.length) err('duplicate sign ids');
  for (const id of h.decisiveSignIds) if (!signIds.has(id)) err(`decisive sign ${id} does not exist`);

  for (const [a, b] of s.conflicts) {
    if (!vehicleIds.has(a) || !vehicleIds.has(b)) err('conflict references unknown vehicle');
  }

  // Sign consistency with declared road priority.
  if (s.roads.kind === 'equal') {
    if (s.signs.length > 0) err('equal-road scenarios must not show priority signs');
  } else {
    const [m1, m2] = s.roads.mainArms;
    if (m1 === m2) err('main road needs two distinct arms');
    const bends = !areOpposite(m1, m2);
    for (const arm of ARMS) {
      const sign = s.signs.find((g) => g.arm === arm);
      if (!sign) {
        err(`no priority sign facing arm ${arm}`);
        continue;
      }
      const shouldBeMain = arm === m1 || arm === m2;
      if (shouldBeMain !== (sign.type === 'main_road')) err(`sign on arm ${arm} contradicts main road`);
      if (bends) {
        const p = sign.plateMainArms;
        if (!p || !((p[0] === m1 && p[1] === m2) || (p[0] === m2 && p[1] === m1))) err(`sign on arm ${arm} needs a matching direction plate`);
      } else if (sign.plateMainArms) {
        err(`straight main road should not carry a direction plate on arm ${arm}`);
      }
    }
  }

  for (const field of ['titleKa', 'promptKa', 'roadStatusKa', 'questionKa', 'decisiveRuleKa'] as const) {
    if (!s[field].trim()) err(`${field} is empty`);
  }
  if (s.version < 1) err('version must be ≥ 1');
  return errors;
}

export function validateChapter(c: ChapterManifest): string[] {
  const errors: string[] = [];
  const ids = c.scenarios.map((s) => s.id);
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`duplicate scenario id ${id}`);
    seen.add(id);
  }
  const byId = new Map(c.scenarios.map((s) => [s.id, s]));
  const expectMode = (id: string, mode: Scenario['mode']) => {
    const s = byId.get(id);
    if (!s) errors.push(`${c.id}: unknown scenario ${id}`);
    else if (s.mode !== mode) errors.push(`${id}: expected mode ${mode}, got ${s.mode}`);
    else if (s.chapterId !== c.id) errors.push(`${id}: wrong chapterId`);
  };
  c.lessons.forEach((l) => {
    expectMode(l.scenarioId, 'lesson');
    if (byId.get(l.scenarioId)?.ruleId !== l.ruleId) errors.push(`lesson ${l.scenarioId} rule mismatch`);
  });
  c.guidedIds.forEach((id) => expectMode(id, 'guided'));
  c.independentIds.forEach((id) => expectMode(id, 'independent'));
  Object.values(c.alternateIdsByRule).forEach((id) => id && expectMode(id, 'alternate'));

  for (const rule of c.ruleIds) {
    const has = (list: string[]) => list.some((id) => byId.get(id)?.ruleId === rule);
    if (!c.lessons.some((l) => l.ruleId === rule)) errors.push(`rule ${rule} has no lesson`);
    if (!has(c.guidedIds)) errors.push(`rule ${rule} has no guided exercise`);
    if (!has(c.independentIds)) errors.push(`rule ${rule} has no independent exercise`);
  }
  for (const s of c.scenarios) errors.push(...validateScenario(s));
  return errors;
}
