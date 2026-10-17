/**
 * Content model for „გზის ლოგიკა“.
 *
 * Scenarios are hand-authored data. The engine never infers legal answers:
 * `correctOptionId` and every explanation are written by a content author and
 * validated for internal consistency (see validate.ts and the test suite).
 */

/** Compass arm of a four-way intersection. North is screen-up. */
export type Arm = 'N' | 'E' | 'S' | 'W';

/** Supported maneuvers in this chapter. U-turns are described in rules but not drawn. */
export type Maneuver = 'straight' | 'left' | 'right';

export type ReviewStatus = 'draft' | 'source_checked' | 'instructor_reviewed';

export type ExerciseMode = 'lesson' | 'guided' | 'independent' | 'alternate';

export type RuleId = 'R36-4a' | 'R36-4b' | 'R36-4c' | 'R36-4d';

export type BodyStyle = 'sedan' | 'hatch' | 'suv';

export interface VehicleSpec {
  /** Stable id used by options, paths and highlights. */
  id: string;
  /** Short visible label drawn on the vehicle, e.g. "A". */
  label: string;
  isLearner: boolean;
  /** Arm the vehicle is approaching from. */
  approach: Arm;
  maneuver: Maneuver;
  body: BodyStyle;
  /** Paint colour. Never encodes the answer; chosen for contrast only. */
  color: string;
  /** Plain-language appearance used in text descriptions, e.g. „ლურჯი სედანი“. */
  appearanceKa: string;
  /** Distance from intersection centre to the vehicle centre while frozen (scene units). */
  startDistance?: number;
}

/**
 * Road priority for this intersection.
 * - equal: every approach is explicitly of equal importance.
 * - main: `mainArms` lists the two arms that form the main road. When the two arms
 *   are not opposite each other, the main road changes direction (Art. 36(4)(b)).
 */
export type RoadPriority = { kind: 'equal' } | { kind: 'main'; mainArms: [Arm, Arm] };

export type SignType = 'main_road' | 'yield';

export interface SignSpec {
  id: string;
  type: SignType;
  /** Approach the sign faces. It stands on the driver's right before the intersection. */
  arm: Arm;
  /** When present, a plate 8.13 „მთავარი გზის მიმართულება“ is mounted below the sign. */
  plateMainArms?: [Arm, Arm];
}

export type AnswerOption =
  | { id: string; kind: 'vehicle_first'; vehicleId: string; labelKa: string }
  | { id: string; kind: 'simultaneous'; labelKa: string };

export interface OptionExplanation {
  /** One-line verdict, e.g. „სწორია“ or the named misconception. */
  titleKa: string;
  bodyKa: string;
}

export interface HighlightSpec {
  /** Vehicle with priority. */
  priorityVehicleId: string;
  /** Vehicle that must yield. */
  yieldingVehicleId: string;
  /** Sign ids whose meaning decides the case. */
  decisiveSignIds: string[];
  /** Optional relationship line drawn between two vehicles after submission. */
  relation?: { fromVehicleId: string; toVehicleId: string; labelKa: string };
}

export interface ScenarioSource {
  ruleId: RuleId;
  /** Additional rules that also apply, e.g. 36(4)(c) inside a 36(4)(b) case. */
  supportingRuleIds?: RuleId[];
}

export interface Scenario {
  id: string;
  /** Bump when the scenario's meaning changes; attempts store this. */
  version: number;
  chapterId: string;
  ruleId: RuleId;
  mode: ExerciseMode;
  titleKa: string;
  promptKa: string;
  /** Short line that explicitly establishes the road status in the prompt. */
  roadStatusKa: string;
  vehicles: VehicleSpec[];
  roads: RoadPriority;
  signs: SignSpec[];
  questionKa: string;
  options: AnswerOption[];
  correctOptionId: string;
  explanationsByOption: Record<string, OptionExplanation>;
  /** The decisive rule in one or two sentences, shown after any submission. */
  decisiveRuleKa: string;
  /** Vehicle pairs whose intended paths are declared to cross or merge. */
  conflicts: Array<[string, string]>;
  highlight: HighlightSpec;
  source: ScenarioSource;
  reviewStatus: ReviewStatus;
  /** Author notes: why this layout was chosen, what it tests. Not shown to learners. */
  authorNotes?: string;
}

export interface LessonContent {
  scenarioId: string;
  ruleId: RuleId;
  titleKa: string;
  /** One short plain-language explanation. */
  explanationKa: string;
  /** Up to three short points shown under the explanation. */
  pointsKa: string[];
}

export interface RuleContent {
  id: RuleId;
  titleKa: string;
  articleKa: string;
  /** Plain-language Georgian paraphrase. */
  plainKa: string;
  /** Official wording, quoted from the consolidated text for the „წესის წყარო“ panel. */
  officialTextKa: string;
}

export interface SourceRegisterEntry {
  ruleId: RuleId;
  article: string;
  paragraph: string;
  sourceUrl: string;
  sourceTitle: string;
  consolidatedVersion: string;
  dateChecked: string;
  paraphraseKa: string;
  reviewStatus: ReviewStatus;
  notes: string;
}

export interface ChapterManifest {
  id: string;
  /** Bumped whenever any scenario in the chapter changes meaning. */
  contentVersion: number;
  titleKa: string;
  subtitleKa: string;
  summaryKa: string;
  /** Simplified conditions that apply to every scenario in the chapter. */
  conditionsKa: string[];
  ruleIds: RuleId[];
  lessons: LessonContent[];
  guidedIds: string[];
  independentIds: string[];
  /** Extra hand-authored variant per rule, offered as a retry after a mistake. */
  alternateIdsByRule: Partial<Record<RuleId, string>>;
  scenarios: Scenario[];
}
