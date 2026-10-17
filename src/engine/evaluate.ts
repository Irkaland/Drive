import type { AnswerOption, OptionExplanation, Scenario } from '../content/types';

export interface Evaluation {
  correct: boolean;
  option: AnswerOption;
  explanation: OptionExplanation;
  correctOption: AnswerOption;
}

/** Evaluate a selected option against the hand-authored answer. */
export function evaluateAnswer(scenario: Scenario, optionId: string): Evaluation {
  const option = scenario.options.find((o) => o.id === optionId);
  if (!option) throw new Error(`Option ${optionId} does not exist in ${scenario.id}`);
  const correctOption = scenario.options.find((o) => o.id === scenario.correctOptionId);
  if (!correctOption) throw new Error(`Scenario ${scenario.id} has no valid correct option`);
  const explanation = scenario.explanationsByOption[optionId];
  if (!explanation) throw new Error(`Option ${optionId} in ${scenario.id} has no explanation`);
  return { correct: optionId === scenario.correctOptionId, option, explanation, correctOption };
}
