import type { ChapterManifest, RuleId, Scenario } from '../content/types';
import type { Attempt, ProgressData } from './storage';

export interface AttemptInput {
  scenario: Scenario;
  selectedOptionId: string;
  correct: boolean;
  assistanceUsed: boolean;
  /** Token created when the question was presented; identical tokens are recorded once. */
  submissionId: string;
  now?: Date;
}

export interface RecordResult {
  data: ProgressData;
  attempt: Attempt;
  duplicate: boolean;
}

/** Attempts that belong to the scenario's current content version, oldest first. */
export function attemptsFor(data: ProgressData, scenario: Pick<Scenario, 'id' | 'version'>): Attempt[] {
  return data.attempts
    .filter((a) => a.scenarioId === scenario.id && a.contentVersion === scenario.version)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function firstAttemptFor(data: ProgressData, scenario: Pick<Scenario, 'id' | 'version'>): Attempt | undefined {
  return attemptsFor(data, scenario).find((a) => a.firstAttempt);
}

export function latestAttemptFor(data: ProgressData, scenario: Pick<Scenario, 'id' | 'version'>): Attempt | undefined {
  const list = attemptsFor(data, scenario);
  return list[list.length - 1];
}

/**
 * Append an attempt. Never overwrites: a retry is stored as a new attempt
 * with firstAttempt = false, so the original answer is preserved. Recording
 * the same submissionId twice is a no-op.
 */
export function recordAttempt(data: ProgressData, input: AttemptInput): RecordResult {
  const existing = data.attempts.find((a) => a.id === input.submissionId);
  if (existing) return { data, attempt: existing, duplicate: true };
  const { scenario } = input;
  const attempt: Attempt = {
    id: input.submissionId,
    chapterId: scenario.chapterId,
    scenarioId: scenario.id,
    contentVersion: scenario.version,
    ruleId: scenario.ruleId,
    mode: scenario.mode,
    selectedOptionId: input.selectedOptionId,
    correct: input.correct,
    firstAttempt: attemptsFor(data, scenario).length === 0,
    assistanceUsed: input.assistanceUsed,
    timestamp: (input.now ?? new Date()).toISOString(),
  };
  return { data: { ...data, attempts: [...data.attempts, attempt] }, attempt, duplicate: false };
}

export function completeLesson(data: ProgressData, scenarioId: string): ProgressData {
  if (data.completedLessons.includes(scenarioId)) return data;
  return { ...data, completedLessons: [...data.completedLessons, scenarioId] };
}

/* ---------------- results ---------------- */

export interface RuleResult {
  ruleId: RuleId;
  guided?: Attempt;
  independent?: Attempt;
  alternate?: Attempt;
  guidedScenarioId?: string;
  independentScenarioId?: string;
  alternateScenarioId?: string;
  needsReview: boolean;
}

export interface ChapterResults {
  independent: { correct: number; answered: number; total: number };
  guided: { firstCorrect: number; answered: number; total: number; totalAttempts: number };
  assistance: { count: number; scenarioIds: string[] };
  byRule: RuleResult[];
  /** Scenarios whose first attempt was incorrect (guided, independent, alternate). */
  mistakes: Attempt[];
  lessonsDone: number;
  lessonsTotal: number;
  allIndependentAnswered: boolean;
}

export function computeResults(chapter: ChapterManifest, data: ProgressData): ChapterResults {
  const byId = new Map(chapter.scenarios.map((s) => [s.id, s]));
  const first = (id: string | undefined) => {
    const s = id ? byId.get(id) : undefined;
    return s ? firstAttemptFor(data, s) : undefined;
  };

  const indFirsts = chapter.independentIds.map(first);
  const guidedFirsts = chapter.guidedIds.map(first);
  const guidedAttempts = chapter.guidedIds.reduce((n, id) => {
    const s = byId.get(id);
    return n + (s ? attemptsFor(data, s).length : 0);
  }, 0);

  const scoredIds = [...chapter.guidedIds, ...chapter.independentIds, ...Object.values(chapter.alternateIdsByRule)].filter(
    (x): x is string => !!x,
  );
  const scoredFirsts = scoredIds.map(first).filter((a): a is Attempt => !!a);
  const assisted = scoredIds.filter((id) => {
    const s = byId.get(id);
    return s ? attemptsFor(data, s).some((a) => a.assistanceUsed) : false;
  });

  const byRule: RuleResult[] = chapter.ruleIds.map((ruleId) => {
    const guidedScenarioId = chapter.guidedIds.find((id) => byId.get(id)?.ruleId === ruleId);
    const independentScenarioId = chapter.independentIds.find((id) => byId.get(id)?.ruleId === ruleId);
    const alternateScenarioId = chapter.alternateIdsByRule[ruleId];
    const guided = first(guidedScenarioId);
    const independent = first(independentScenarioId);
    const alternate = first(alternateScenarioId);
    const needsReview = (independent ? !independent.correct : false) || (guided ? !guided.correct : false);
    return { ruleId, guided, independent, alternate, guidedScenarioId, independentScenarioId, alternateScenarioId, needsReview };
  });

  return {
    independent: {
      correct: indFirsts.filter((a) => a?.correct).length,
      answered: indFirsts.filter(Boolean).length,
      total: chapter.independentIds.length,
    },
    guided: {
      firstCorrect: guidedFirsts.filter((a) => a?.correct).length,
      answered: guidedFirsts.filter(Boolean).length,
      total: chapter.guidedIds.length,
      totalAttempts: guidedAttempts,
    },
    assistance: { count: assisted.length, scenarioIds: assisted },
    byRule,
    mistakes: scoredFirsts.filter((a) => !a.correct),
    lessonsDone: chapter.lessons.filter((l) => data.completedLessons.includes(l.scenarioId)).length,
    lessonsTotal: chapter.lessons.length,
    allIndependentAnswered: indFirsts.every(Boolean),
  };
}
