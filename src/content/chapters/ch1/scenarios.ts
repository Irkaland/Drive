import type {
  AnswerOption,
  Arm,
  BodyStyle,
  Maneuver,
  OptionExplanation,
  RoadPriority,
  Scenario,
  SignSpec,
  VehicleSpec,
} from '../../types';
import { ARMS, areOpposite } from '../../../engine/geometry';

export const CHAPTER_ID = 'ch1-unregulated';

/* ---------- small authoring helpers (they only reduce repetition; every answer is hand-written) ---------- */

const PAINT = {
  blue: { color: '#2f6fb0', ka: 'ლურჯი' },
  brick: { color: '#c0533a', ka: 'აგურისფერი' },
  green: { color: '#2e8a63', ka: 'მწვანე' },
  purple: { color: '#6c58b5', ka: 'იისფერი' },
  yellow: { color: '#e0ac2b', ka: 'ყვითელი' },
  white: { color: '#eeeae0', ka: 'თეთრი' },
  teal: { color: '#1f8a96', ka: 'ფირუზისფერი' },
} as const;

const BODY_KA: Record<BodyStyle, string> = { sedan: 'სედანი', hatch: 'ჰეჩბეკი', suv: 'ჯიპი' };

function car(
  id: 'A' | 'B',
  approach: Arm,
  maneuver: Maneuver,
  body: BodyStyle,
  paint: keyof typeof PAINT,
  startDistance?: number,
): VehicleSpec {
  return {
    id,
    label: id,
    isLearner: id === 'A',
    approach,
    maneuver,
    body,
    color: PAINT[paint].color,
    appearanceKa: `${PAINT[paint].ka} ${BODY_KA[body]}`,
    ...(startDistance !== undefined ? { startDistance } : {}),
  };
}

/** Priority signs for every approach: main-road signs on main arms, give-way on the rest. */
function prioritySigns(roads: RoadPriority): SignSpec[] {
  if (roads.kind === 'equal') return [];
  const bends = !areOpposite(roads.mainArms[0], roads.mainArms[1]);
  return ARMS.map((arm) => ({
    id: `sign-${arm}`,
    type: roads.mainArms.includes(arm) ? 'main_road' : 'yield',
    arm,
    ...(bends ? { plateMainArms: roads.mainArms } : {}),
  }));
}

const OPT_A: AnswerOption = { id: 'a_first', kind: 'vehicle_first', vehicleId: 'A', labelKa: 'პირველი გადის შენი ავტომობილი (A)' };
const OPT_B: AnswerOption = { id: 'b_first', kind: 'vehicle_first', vehicleId: 'B', labelKa: 'პირველი გადის ავტომობილი B' };
const OPT_TOGETHER: AnswerOption = {
  id: 'together',
  kind: 'simultaneous',
  labelKa: 'ორივე გადის ერთდროულად — ერთმანეთს ხელს არ უშლიან',
};
const OPTIONS_3 = [OPT_A, OPT_B, OPT_TOGETHER];
const OPTIONS_2 = [OPT_A, OPT_B];

const QUESTION = 'ვინ გადის გზაჯვარედინზე პირველი?';
const EQUAL_STATUS = 'ამ ამოცანაში ორივე გზა თანაბარმნიშვნელოვანია: პრიორიტეტის ნიშნები არ არის და ეს პირობით არის მოცემული.';
const SIGNS_STATUS = 'გზაჯვარედინზე პრიორიტეტის ნიშნებია. დააკვირდი, რომელ ნიშანს ხედავს თითოეული მძღოლი.';

const RIGHT_LABEL = 'B — შენგან მარჯვნივ';
const A_ON_B_RIGHT = 'შენ — B-სგან მარჯვნივ';
const ONCOMING_LABEL = 'B — შემხვედრი';

function ok(bodyKa: string): OptionExplanation {
  return { titleKa: 'სწორია', bodyKa };
}

type Base = Omit<Scenario, 'chapterId' | 'version' | 'reviewStatus' | 'signs' | 'questionKa'> & {
  signs?: SignSpec[];
};

function scenario(base: Base): Scenario {
  return {
    ...base,
    chapterId: CHAPTER_ID,
    version: 1,
    reviewStatus: 'source_checked',
    questionKa: QUESTION,
    signs: base.signs ?? prioritySigns(base.roads),
  };
}

/* ---------- lessons ---------- */

const L1 = scenario({
  id: 'ch1-L1-main-secondary',
  ruleId: 'R36-4a',
  mode: 'lesson',
  titleKa: 'მთავარი და მეორეხარისხოვანი გზა',
  promptKa: 'შენ (A) სამხრეთიდან უახლოვდები გზაჯვარედინს და პირდაპირ აპირებ გავლას. B დასავლეთიდან მოდის და ისიც პირდაპირ მიდის.',
  roadStatusKa: 'აღმოსავლეთ–დასავლეთის გზა მთავარია. შენს წინ ნიშანია „დაუთმე გზა“, B-ს წინ — „მთავარი გზა“.',
  vehicles: [car('A', 'S', 'straight', 'sedan', 'blue'), car('B', 'W', 'straight', 'hatch', 'brick')],
  roads: { kind: 'main', mainArms: ['E', 'W'] },
  options: OPTIONS_2,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'შენ მეორეხარისხოვან გზაზე ხარ',
      bodyKa:
        'შენს წინ ნიშანია „დაუთმე გზა“, B კი მთავარ გზაზე მოძრაობს. B შენგან მარცხნივ არის, მაგრამ აქ ამას მნიშვნელობა არ აქვს: მეორეხარისხოვანი გზიდან გზას უთმობ მთავარი გზიდან მომავალ ყველა ავტომობილს.',
    },
    b_first: ok(
      'B მთავარ გზაზეა (მის წინ ნიშანია „მთავარი გზა“), შენ კი — მეორეხარისხოვანზე. ამიტომ ჩერდები და B-ს ატარებ, მიუხედავად იმისა, რომ ის შენგან მარცხნივ მოდის.',
    ),
  },
  decisiveRuleKa: 'მეორეხარისხოვან გზაზე მყოფი მძღოლი გზას უთმობს მთავარი გზიდან მომავალ ავტომობილს, საით და საიდანაც არ უნდა მოძრაობდეს ის.',
  conflicts: [['A', 'B']],
  highlight: { priorityVehicleId: 'B', yieldingVehicleId: 'A', decisiveSignIds: ['sign-S', 'sign-W'] },
  source: { ruleId: 'R36-4a' },
});

const L2 = scenario({
  id: 'ch1-L2-equal-right',
  ruleId: 'R36-4c',
  mode: 'lesson',
  titleKa: 'თანაბარმნიშვნელოვანი გზები',
  promptKa: 'შენ (A) დასავლეთიდან მოდიხარ და პირდაპირ, აღმოსავლეთისკენ მიდიხარ. B სამხრეთიდან მოდის და პირდაპირ, ჩრდილოეთისკენ მიდის.',
  roadStatusKa: EQUAL_STATUS,
  vehicles: [car('A', 'W', 'straight', 'sedan', 'blue'), car('B', 'S', 'straight', 'sedan', 'yellow')],
  roads: { kind: 'equal' },
  options: OPTIONS_2,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'B შენგან მარჯვნივ არის',
      bodyKa:
        'აღმოსავლეთისკენ მოძრაობისას შენი მარჯვენა მხარე სამხრეთია — ეკრანზე ქვემოთ. B სწორედ იქიდან მოდის. თანაბარმნიშვნელოვან გზებზე მარჯვნიდან მომავალს უთმობ გზას.',
    },
    b_first: ok('აღმოსავლეთისკენ მოძრაობისას შენი მარჯვენა მხარე სამხრეთია, საიდანაც B მოდის. ამიტომ ჩერდები და B-ს ატარებ.'),
  },
  decisiveRuleKa: 'თანაბარმნიშვნელოვანი გზების გადაკვეთაზე გზას უთმობ მარჯვნიდან მომავალს. „მარჯვნივ“ — მძღოლის მოძრაობის მიმართულებით.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'B',
    yieldingVehicleId: 'A',
    decisiveSignIds: [],
    relation: { fromVehicleId: 'A', toVehicleId: 'B', labelKa: RIGHT_LABEL },
  },
  source: { ruleId: 'R36-4c' },
});

const L3 = scenario({
  id: 'ch1-L3-left-oncoming',
  ruleId: 'R36-4d',
  mode: 'lesson',
  titleKa: 'მარცხნივ მოხვევა',
  promptKa: 'შენ (A) აღმოსავლეთიდან მოდიხარ და მარცხნივ, სამხრეთისკენ უხვევ. B შემხვედრი მიმართულებით, დასავლეთიდან მოდის და პირდაპირ მიდის.',
  roadStatusKa: EQUAL_STATUS,
  vehicles: [car('A', 'E', 'left', 'sedan', 'blue'), car('B', 'W', 'straight', 'hatch', 'green')],
  roads: { kind: 'equal' },
  options: OPTIONS_2,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'მარცხნივ უხვევ — შემხვედრს უთმობ',
      bodyKa: 'მარცხნივ მოხვევისას B-ს ზოლს კვეთ. B საპირისპირო მიმართულებიდან პირდაპირ მიდის, ამიტომ ჯერ ის გადის.',
    },
    b_first: ok('მარცხნივ მოხვევისას გზას უთმობ შემხვედრს, რომელიც პირდაპირ მიდის. B გაივლის, შემდეგ კი შენ ასრულებ მოხვევას.'),
  },
  decisiveRuleKa:
    'მარცხნივ მოხვევისას ან მობრუნებისას გზას უთმობ თანაბარმნიშვნელოვან გზაზე საპირისპირო მიმართულებიდან პირდაპირ ან მარჯვნივ მოძრავ ავტომობილს.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'B',
    yieldingVehicleId: 'A',
    decisiveSignIds: [],
    relation: { fromVehicleId: 'A', toVehicleId: 'B', labelKa: ONCOMING_LABEL },
  },
  source: { ruleId: 'R36-4d' },
});

const L4 = scenario({
  id: 'ch1-L4-main-bends',
  ruleId: 'R36-4b',
  mode: 'lesson',
  titleKa: 'მთავარი გზა უხვევს',
  promptKa: 'მთავარი გზა ჩრდილოეთიდან აღმოსავლეთისკენ უხვევს. შენ (A) ჩრდილოეთიდან მოდიხარ და პირდაპირ, სამხრეთისკენ მიდიხარ. B აღმოსავლეთიდან მოდის და პირდაპირ, დასავლეთისკენ მიდის.',
  roadStatusKa: 'ორივე მთავარი გზიდან მოდიხართ: ორივეს წინ ნიშანია „მთავარი გზა“ დაფით, რომელიც გზის მოხვევას აჩვენებს.',
  vehicles: [car('A', 'N', 'straight', 'sedan', 'blue'), car('B', 'E', 'straight', 'suv', 'purple')],
  roads: { kind: 'main', mainArms: ['N', 'E'] },
  options: OPTIONS_2,
  correctOptionId: 'a_first',
  explanationsByOption: {
    a_first: ok(
      'ორივე მთავარ გზაზე ხართ. თქვენ შორის თანაბარმნიშვნელოვანი გზების წესი მოქმედებს: B დასავლეთისკენ მიდის და მისი მარჯვენა მხარე ჩრდილოეთია — იქიდან შენ მოდიხარ. ამიტომ B გითმობს გზას.',
    ),
    b_first: {
      titleKa: 'B-სთვის შენ მარჯვნივ ხარ',
      bodyKa:
        'ორივე მთავარ გზაზე ხართ, ამიტომ ერთმანეთს შორის თანაბარმნიშვნელოვანი გზების წესს იცავთ. B დასავლეთისკენ მიდის — მისი მარჯვენა მხარე ჩრდილოეთია, საიდანაც შენ მოდიხარ. ამიტომ B უთმობს გზას შენ.',
    },
  },
  decisiveRuleKa:
    'თუ მთავარი გზა გზაჯვარედინზე მიმართულებას იცვლის, მასზე მყოფი მძღოლები ერთმანეთს შორის თანაბარმნიშვნელოვანი გზების წესებს იცავენ.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'A',
    yieldingVehicleId: 'B',
    decisiveSignIds: ['sign-N', 'sign-E'],
    relation: { fromVehicleId: 'B', toVehicleId: 'A', labelKa: A_ON_B_RIGHT },
  },
  source: { ruleId: 'R36-4b', supportingRuleIds: ['R36-4c'] },
});

/* ---------- guided exercises (design seeds C, A, B, D) ---------- */

const G1 = scenario({
  id: 'ch1-G1-main-road',
  ruleId: 'R36-4a',
  mode: 'guided',
  titleKa: 'მთავარ გზაზე ხარ',
  promptKa: 'შენ (A) სამხრეთიდან მოდიხარ და პირდაპირ, ჩრდილოეთისკენ მიდიხარ. B აღმოსავლეთიდან მოდის და პირდაპირ, დასავლეთისკენ მიდის.',
  roadStatusKa: SIGNS_STATUS,
  vehicles: [car('A', 'S', 'straight', 'sedan', 'blue'), car('B', 'E', 'straight', 'hatch', 'brick')],
  roads: { kind: 'main', mainArms: ['N', 'S'] },
  options: OPTIONS_3,
  correctOptionId: 'a_first',
  explanationsByOption: {
    a_first: ok(
      'შენ მთავარ გზაზე ხარ — შენს წინ ნიშანია „მთავარი გზა“. B-ს წინ ნიშანია „დაუთმე გზა“, ამიტომ ის გელოდება, მიუხედავად იმისა, რომ შენგან მარჯვნივ მოდის.',
    ),
    b_first: {
      titleKa: '„მარჯვნიდან მომავალის“ წესი აქ არ მოქმედებს',
      bodyKa:
        'B მართლაც შენგან მარჯვნივ არის, მაგრამ ეს წესი მხოლოდ თანაბარმნიშვნელოვან გზებზე მოქმედებს. ნიშნები აჩვენებს, რომ შენ მთავარ გზაზე ხარ, B კი მეორეხარისხოვანზე — ამიტომ B უთმობს გზას.',
    },
    together: {
      titleKa: 'ტრაექტორიები იკვეთება',
      bodyKa:
        'შენ ჩრდილოეთისკენ მიდიხარ, B — დასავლეთისკენ. თქვენი გზები გზაჯვარედინის შუაში იკვეთება, ამიტომ ერთდროულად გავლა საშიშია. ერთ-ერთმა უნდა დაუთმოს — ამ შემთხვევაში B-მ, რადგან ის მეორეხარისხოვან გზაზეა.',
    },
  },
  decisiveRuleKa: 'მეორეხარისხოვან გზაზე მყოფი მძღოლი გზას უთმობს მთავარი გზიდან მომავალს. მთავარ გზაზე „მარჯვნიდან მომავალის“ წესი არ მოქმედებს.',
  conflicts: [['A', 'B']],
  highlight: { priorityVehicleId: 'A', yieldingVehicleId: 'B', decisiveSignIds: ['sign-S', 'sign-E'] },
  source: { ruleId: 'R36-4a' },
  authorNotes: 'Seed C. B is on the learner’s right on purpose: the main-road sign must override the right-hand rule.',
});

const G2 = scenario({
  id: 'ch1-G2-equal-right',
  ruleId: 'R36-4c',
  mode: 'guided',
  titleKa: 'ვინ არის მარჯვნივ?',
  promptKa: 'შენ (A) სამხრეთიდან მოდიხარ და პირდაპირ, ჩრდილოეთისკენ მიდიხარ. B აღმოსავლეთიდან მოდის და პირდაპირ, დასავლეთისკენ მიდის.',
  roadStatusKa: EQUAL_STATUS,
  vehicles: [car('A', 'S', 'straight', 'sedan', 'blue'), car('B', 'E', 'straight', 'sedan', 'yellow')],
  roads: { kind: 'equal' },
  options: OPTIONS_3,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'მარჯვნიდან მომავალს უპირატესობა აქვს',
      bodyKa:
        'თანაბარმნიშვნელოვან გზებზე გზას უთმობ მას, ვინც შენგან მარჯვნივ არის. ჩრდილოეთისკენ მოძრაობისას შენი მარჯვენა მხარე აღმოსავლეთია — სწორედ იქიდან მოდის B.',
    },
    b_first: ok(
      'გზები თანაბარმნიშვნელოვანია, B კი შენგან მარჯვნივ მოდის (შენ ჩრდილოეთისკენ მიდიხარ, B — აღმოსავლეთიდან მოდის). ამიტომ ჩერდები და B-ს ატარებ.',
    ),
    together: {
      titleKa: 'ტრაექტორიები იკვეთება',
      bodyKa:
        'შენი და B-ს გზები გზაჯვარედინის შუაში იკვეთება, ამიტომ ერთდროულად ვერ გაივლით. თანაბარმნიშვნელოვან გზებზე რიგს მარჯვნიდან მომავალის წესი ადგენს.',
    },
  },
  decisiveRuleKa: 'თანაბარმნიშვნელოვანი გზების გადაკვეთაზე გზას უთმობ მარჯვნიდან მომავალს.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'B',
    yieldingVehicleId: 'A',
    decisiveSignIds: [],
    relation: { fromVehicleId: 'A', toVehicleId: 'B', labelKa: RIGHT_LABEL },
  },
  source: { ruleId: 'R36-4c' },
  authorNotes: 'Seed A.',
});

const G3 = scenario({
  id: 'ch1-G3-left-turn',
  ruleId: 'R36-4d',
  mode: 'guided',
  titleKa: 'მარცხნივ მოხვევა შემხვედრის წინ',
  promptKa: 'შენ (A) სამხრეთიდან მოდიხარ და მარცხნივ, დასავლეთისკენ უხვევ. B ჩრდილოეთიდან მოდის და პირდაპირ, სამხრეთისკენ მიდის.',
  roadStatusKa: EQUAL_STATUS,
  vehicles: [car('A', 'S', 'left', 'sedan', 'blue'), car('B', 'N', 'straight', 'hatch', 'green')],
  roads: { kind: 'equal' },
  options: OPTIONS_3,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'მარცხნივ მოხვევისას შემხვედრს უთმობ',
      bodyKa:
        'მარცხნივ მოხვევისას შემხვედრი ავტომობილის გზას კვეთ. B საპირისპირო მიმართულებიდან პირდაპირ მოდის, ამიტომ უპირატესობა მას აქვს. მოხვევის მაჩვენებლის ჩართვა უპირატესობას არ გაძლევს.',
    },
    b_first: ok(
      'შენ მარცხნივ უხვევ, B კი საპირისპირო მიმართულებიდან პირდაპირ მიდის. ასეთ დროს გზას უთმობ შემხვედრს და მოხვევას ასრულებ მას შემდეგ, რაც ის გაივლის.',
    ),
    together: {
      titleKa: 'მარცხნივ მოხვევა შემხვედრის გზას კვეთს',
      bodyKa:
        'შეიძლება მოგეჩვენოს, რომ ადგილი საკმარისია, მაგრამ მარცხნივ მოხვევისას შენი ტრაექტორია B-ს ზოლს კვეთს. ერთდროულად მოძრაობა საფრთხეს ქმნის — ჯერ B გადის.',
    },
  },
  decisiveRuleKa: 'მარცხნივ მოხვევისას გზას უთმობ საპირისპირო მიმართულებიდან პირდაპირ ან მარჯვნივ მოძრავ ავტომობილს.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'B',
    yieldingVehicleId: 'A',
    decisiveSignIds: [],
    relation: { fromVehicleId: 'A', toVehicleId: 'B', labelKa: ONCOMING_LABEL },
  },
  source: { ruleId: 'R36-4d' },
  authorNotes: 'Seed B. B is neither on the learner’s right nor left, so only 36(4)(d) decides.',
});

const G4 = scenario({
  id: 'ch1-G4-main-bends',
  ruleId: 'R36-4b',
  mode: 'guided',
  titleKa: 'ორივე მთავარ გზაზე',
  promptKa: 'შენ (A) სამხრეთიდან მოდიხარ და პირდაპირ, ჩრდილოეთისკენ მიდიხარ. B აღმოსავლეთიდან მოდის და პირდაპირ, დასავლეთისკენ მიდის.',
  roadStatusKa: SIGNS_STATUS,
  vehicles: [car('A', 'S', 'straight', 'sedan', 'blue'), car('B', 'E', 'straight', 'suv', 'purple')],
  roads: { kind: 'main', mainArms: ['S', 'E'] },
  options: OPTIONS_3,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'ორივე მთავარ გზაზე ხართ',
      bodyKa:
        'შენც და B-ც მთავარი გზიდან მოდიხართ — ორივეს წინ ნიშანია „მთავარი გზა“ დაფით, რომელიც გზის მოხვევას აჩვენებს. ასეთ დროს ერთმანეთს შორის თანაბარმნიშვნელოვანი გზების წესს იცავთ: B შენგან მარჯვნივ არის, ამიტომ ის გადის პირველი.',
    },
    b_first: ok(
      'მთავარი გზა სამხრეთიდან აღმოსავლეთისკენ უხვევს და ორივე მასზე ხართ. თქვენ შორის მოქმედებს თანაბარმნიშვნელოვანი გზების წესი: B შენგან მარჯვნივ მოდის, ამიტომ გზას მას უთმობ. ის, რომ ორივე ტოვებთ მთავარ გზას, რიგს არ ცვლის.',
    ),
    together: {
      titleKa: 'ტრაექტორიები იკვეთება',
      bodyKa:
        'შენ ჩრდილოეთისკენ მიდიხარ, B — დასავლეთისკენ, და თქვენი გზები გზაჯვარედინზე იკვეთება. ერთ-ერთმა უნდა დაუთმოს: ორივე მთავარ გზაზე ხართ, ამიტომ რიგს მარჯვნიდან მომავალის წესი ადგენს.',
    },
  },
  decisiveRuleKa:
    'მთავარი გზა მიმართულებას იცვლის: მასზე მყოფი მძღოლები ერთმანეთს შორის თანაბარმნიშვნელოვანი გზების წესებს იცავენ — აქ მარჯვნიდან მომავალს უთმობ.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'B',
    yieldingVehicleId: 'A',
    decisiveSignIds: ['sign-S', 'sign-E'],
    relation: { fromVehicleId: 'A', toVehicleId: 'B', labelKa: RIGHT_LABEL },
  },
  source: { ruleId: 'R36-4b', supportingRuleIds: ['R36-4c'] },
  authorNotes:
    'Seed D, verified: main road joins S and E; both vehicles enter from the main road and leave it. Paths cross at the NE quadrant. Under 36(4)(b) the equal-road rule applies between them; B approaches from the learner’s right (learner heading N, right = E). Neither turns left, so 36(4)(d) does not apply.',
});

/* ---------- independent transfer exercises ---------- */

const T1 = scenario({
  id: 'ch1-T1-secondary-right-turn',
  ruleId: 'R36-4a',
  mode: 'independent',
  titleKa: 'მარჯვნივ მოხვევა მთავარ გზაზე',
  promptKa: 'შენ (A) აღმოსავლეთიდან მოდიხარ და მარჯვნივ, ჩრდილოეთისკენ უხვევ. B სამხრეთიდან მოდის და პირდაპირ, ჩრდილოეთისკენ მიდის.',
  roadStatusKa: SIGNS_STATUS,
  vehicles: [car('A', 'E', 'right', 'hatch', 'green'), car('B', 'S', 'straight', 'suv', 'purple')],
  roads: { kind: 'main', mainArms: ['N', 'S'] },
  options: OPTIONS_3,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'მარჯვნივ მოხვევა უპირატესობას არ გაძლევს',
      bodyKa:
        'შენ მეორეხარისხოვან გზაზე ხარ (შენს წინ ნიშანია „დაუთმე გზა“), B კი მთავარ გზაზე. B შენგან მარცხნივ არის, მაგრამ მთავარ და მეორეხარისხოვან გზებს შორის ამას მნიშვნელობა არ აქვს. მოხვევის შემდეგ B-ს ზოლში შედიხარ — B-ს მოუწევდა დამუხრუჭება.',
    },
    b_first: ok('B მთავარი გზიდან მოდის, შენ — მეორეხარისხოვანიდან. მოხვევის შემდეგ იმავე ზოლში შედიხარ, რომლითაც B მიდის, ამიტომ ჯერ B-ს ატარებ.'),
    together: {
      titleKa: 'ერთსა და იმავე ზოლში შედიხართ',
      bodyKa:
        'მარჯვნივ მოხვევის შემდეგ იმ ზოლში ხვდები, რომლითაც B პირდაპირ მიდის. ერთდროულად ასე ვერ იმოძრავებთ. B მთავარ გზაზეა, ამიტომ ის გადის პირველი.',
    },
  },
  decisiveRuleKa: 'მეორეხარისხოვანი გზიდან გზას უთმობ მთავარი გზიდან მომავალს — მაშინაც, როცა მარჯვნივ უხვევ და ის შენგან მარცხნივ არის.',
  conflicts: [['A', 'B']],
  highlight: { priorityVehicleId: 'B', yieldingVehicleId: 'A', decisiveSignIds: ['sign-E', 'sign-S'] },
  source: { ruleId: 'R36-4a' },
  authorNotes: 'Transfer of G1: learner moves to the secondary road, turns right, and the main-road vehicle is on the learner’s left. Paths merge into the northbound lane.',
});

const T2 = scenario({
  id: 'ch1-T2-equal-right-rotated',
  ruleId: 'R36-4c',
  mode: 'independent',
  titleKa: 'მარჯვნივ — მძღოლის თვალით',
  promptKa: 'შენ (A) ჩრდილოეთიდან მოდიხარ და პირდაპირ, სამხრეთისკენ მიდიხარ. B დასავლეთიდან მოდის და პირდაპირ, აღმოსავლეთისკენ მიდის. შენ გზაჯვარედინთან უფრო ახლოს ხარ.',
  roadStatusKa: EQUAL_STATUS,
  vehicles: [car('A', 'N', 'straight', 'suv', 'teal', 140), car('B', 'W', 'straight', 'hatch', 'white', 190)],
  roads: { kind: 'equal' },
  options: OPTIONS_3,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'უფრო ახლოს ყოფნა უპირატესობას არ იძლევა',
      bodyKa:
        'სამხრეთისკენ მოძრაობისას შენი მარჯვენა მხარე დასავლეთია — ეკრანზე ის მარცხნივ ჩანს. B სწორედ დასავლეთიდან მოდის, ე.ი. შენგან მარჯვნივ. ის, რომ გზაჯვარედინს უფრო ახლოს ხარ, უპირატესობას არ გაძლევს.',
    },
    b_first: ok(
      'გზები თანაბარმნიშვნელოვანია. სამხრეთისკენ მოძრაობისას შენი მარჯვენა მხარე დასავლეთია, საიდანაც B მოდის — ამიტომ მას უთმობ გზას, თუნდაც გზაჯვარედინთან უფრო ახლოს იყო.',
    ),
    together: {
      titleKa: 'ტრაექტორიები იკვეთება',
      bodyKa:
        'შენი და B-ს გზები გზაჯვარედინზე იკვეთება — ერთდროულად გავლა საშიშია. რიგს მარჯვნიდან მომავალის წესი ადგენს: B შენგან მარჯვნივ არის.',
    },
  },
  decisiveRuleKa: 'მარჯვნიდან მომავალს უთმობ — მარჯვენა მხარე შენი მოძრაობის მიმართულებით განისაზღვრება, არა ეკრანის მიხედვით.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'B',
    yieldingVehicleId: 'A',
    decisiveSignIds: [],
    relation: { fromVehicleId: 'A', toVehicleId: 'B', labelKa: RIGHT_LABEL },
  },
  source: { ruleId: 'R36-4c' },
  authorNotes: 'Rotated transfer of G2: learner drives screen-down, so the driver’s right appears on screen-left. Learner is closer to test the “arrived first” misconception.',
});

const T3 = scenario({
  id: 'ch1-T3-left-vs-oncoming-right',
  ruleId: 'R36-4d',
  mode: 'independent',
  titleKa: 'შემხვედრი მარჯვნივ უხვევს',
  promptKa: 'შენ (A) დასავლეთიდან მოდიხარ და მარცხნივ, ჩრდილოეთისკენ უხვევ. B შემხვედრი მიმართულებით, აღმოსავლეთიდან მოდის და მარჯვნივ, ჩრდილოეთისკენ უხვევს.',
  roadStatusKa: EQUAL_STATUS,
  vehicles: [car('A', 'W', 'left', 'hatch', 'brick'), car('B', 'E', 'right', 'sedan', 'teal')],
  roads: { kind: 'equal' },
  options: OPTIONS_3,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'შემხვედრს უთმობ მაშინაც, როცა ის მარჯვნივ უხვევს',
      bodyKa:
        'B საპირისპირო მიმართულებიდან მოდის და მარჯვნივ უხვევს. მარცხნივ მოხვევისას გზას უთმობ შემხვედრს, რომელიც პირდაპირ მიდის ან მარჯვნივ უხვევს. თან ორივე ერთსა და იმავე, ჩრდილოეთისკენ მიმავალ ზოლში შედიხართ.',
    },
    b_first: ok(
      'შენ მარცხნივ უხვევ, B კი შემხვედრი მიმართულებიდან მარჯვნივ. ორივე ერთ ზოლში შედიხართ, ხოლო მარცხნივ მოხვევისას გზას უთმობ შემხვედრს, რომელიც მარჯვნივ უხვევს.',
    ),
    together: {
      titleKa: 'ერთსა და იმავე ზოლში შედიხართ',
      bodyKa:
        'მოხვევის შემდეგ ორივე ჩრდილოეთისკენ მიმავალ ერთსა და იმავე ზოლში ხვდებით. ერთდროულად ასე ვერ იმოძრავებთ — ჯერ B გადის, რადგან შენ მარცხნივ უხვევ.',
    },
  },
  decisiveRuleKa: 'მარცხნივ მოხვევისას გზას უთმობ შემხვედრს, რომელიც პირდაპირ მიდის ან მარჯვნივ უხვევს.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'B',
    yieldingVehicleId: 'A',
    decisiveSignIds: [],
    relation: { fromVehicleId: 'A', toVehicleId: 'B', labelKa: ONCOMING_LABEL },
  },
  source: { ruleId: 'R36-4d' },
  authorNotes: 'Transfer of G3: different approach and the oncoming vehicle turns right instead of going straight. Paths merge into the northbound exit lane.',
});

const T4 = scenario({
  id: 'ch1-T4-main-bends-left',
  ruleId: 'R36-4b',
  mode: 'independent',
  titleKa: 'მთავარ გზას მიჰყვები',
  promptKa: 'შენ (A) დასავლეთიდან მოდიხარ და მარცხნივ, ჩრდილოეთისკენ უხვევ. B ჩრდილოეთიდან მოდის და პირდაპირ, სამხრეთისკენ მიდის.',
  roadStatusKa: SIGNS_STATUS,
  vehicles: [car('A', 'W', 'left', 'suv', 'yellow'), car('B', 'N', 'straight', 'sedan', 'brick')],
  roads: { kind: 'main', mainArms: ['W', 'N'] },
  options: OPTIONS_3,
  correctOptionId: 'a_first',
  explanationsByOption: {
    a_first: ok(
      'მთავარი გზა დასავლეთიდან ჩრდილოეთისკენ უხვევს და ორივე მასზე ხართ. თქვენ შორის თანაბარმნიშვნელოვანი გზების წესი მოქმედებს: B სამხრეთისკენ მიდის, მისი მარჯვენა მხარე დასავლეთია — იქიდან შენ მოდიხარ. B შენი შემხვედრი არ არის, ამიტომ მარცხნივ მოხვევის წესი აქ არ გავალდებულებს.',
    ),
    b_first: {
      titleKa: 'მარცხნივ მოხვევა ყოველთვის დათმობას არ ნიშნავს',
      bodyKa:
        'მარცხნივ მოხვევისას გზას უთმობ საპირისპირო მიმართულებიდან მომავალს. B საპირისპიროდან არ მოდის: ის ჩრდილოეთიდან მოდის, შენ — დასავლეთიდან. ორივე მთავარ გზაზე ხართ, ამიტომ მოქმედებს მარჯვნიდან მომავალის წესი: B-სთვის შენ მარჯვნივ ხარ და B გითმობს გზას.',
    },
    together: {
      titleKa: 'ტრაექტორიები იკვეთება',
      bodyKa:
        'მარცხნივ მოხვევისას შენი ტრაექტორია B-ს ზოლს კვეთს, ამიტომ ერთდროულად გავლა საშიშია. რიგს მთავარ გზაზე მყოფებს შორის მარჯვნიდან მომავალის წესი ადგენს: შენ B-ს მარჯვნივ ხარ.',
    },
  },
  decisiveRuleKa:
    'მთავარ გზაზე, რომელიც მიმართულებას იცვლის, მძღოლები ერთმანეთს შორის თანაბარმნიშვნელოვანი გზების წესებს იცავენ — B-სთვის შენ მარჯვნიდან მომავალი ხარ.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'A',
    yieldingVehicleId: 'B',
    decisiveSignIds: ['sign-W', 'sign-N'],
    relation: { fromVehicleId: 'B', toVehicleId: 'A', labelKa: A_ON_B_RIGHT },
  },
  source: { ruleId: 'R36-4b', supportingRuleIds: ['R36-4c', 'R36-4d'] },
  authorNotes:
    'Transfer of G4 with a changed route: learner follows the bending main road with a left turn. B (also on the main road) is not oncoming (oncoming would be from E), so 36(4)(d) does not apply; the learner is on B’s right (B heading S, right = W).',
});

/* ---------- alternate exercises (offered as a retry after a mistake) ---------- */

const X1 = scenario({
  id: 'ch1-X1-secondary-left-turn',
  ruleId: 'R36-4a',
  mode: 'alternate',
  titleKa: 'მარცხნივ მოხვევა მთავარ გზაზე',
  promptKa: 'შენ (A) ჩრდილოეთიდან მოდიხარ და მარცხნივ, აღმოსავლეთისკენ უხვევ. B აღმოსავლეთიდან მოდის და პირდაპირ, დასავლეთისკენ მიდის.',
  roadStatusKa: SIGNS_STATUS,
  vehicles: [car('A', 'N', 'left', 'sedan', 'purple'), car('B', 'E', 'straight', 'hatch', 'yellow')],
  roads: { kind: 'main', mainArms: ['E', 'W'] },
  options: OPTIONS_3,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'შენ მეორეხარისხოვან გზაზე ხარ',
      bodyKa:
        'შენს წინ ნიშანია „დაუთმე გზა“. B მთავარ გზაზე მოძრაობს და შენგან მარცხნივ არის, მაგრამ მთავარი გზის წესი მარჯვენა-მარცხენა მხარეს არ უყურებს. მოხვევისას B-ს ზოლს კვეთ, ამიტომ ჯერ მას ატარებ.',
    },
    b_first: ok('B მთავარი გზიდან მოდის, შენ — მეორეხარისხოვანიდან. მარცხნივ მოხვევისას მის ზოლს კვეთ, ამიტომ ჯერ B-ს ატარებ.'),
    together: {
      titleKa: 'ტრაექტორიები იკვეთება',
      bodyKa: 'მარცხნივ მოხვევისას B-ს ზოლს კვეთ. ერთდროულად ვერ გაივლით; B მთავარ გზაზეა, ამიტომ ის გადის პირველი.',
    },
  },
  decisiveRuleKa: 'მეორეხარისხოვანი გზიდან გზას უთმობ მთავარი გზიდან მომავალს, საიდანაც არ უნდა მოდიოდეს.',
  conflicts: [['A', 'B']],
  highlight: { priorityVehicleId: 'B', yieldingVehicleId: 'A', decisiveSignIds: ['sign-N', 'sign-E'] },
  source: { ruleId: 'R36-4a' },
});

const X2 = scenario({
  id: 'ch1-X2-equal-you-are-right',
  ruleId: 'R36-4c',
  mode: 'alternate',
  titleKa: 'შეხედე მეორე მძღოლის მხრიდანაც',
  promptKa: 'შენ (A) აღმოსავლეთიდან მოდიხარ და მარჯვნივ, ჩრდილოეთისკენ უხვევ. B სამხრეთიდან მოდის და პირდაპირ, ჩრდილოეთისკენ მიდის.',
  roadStatusKa: EQUAL_STATUS,
  vehicles: [car('A', 'E', 'right', 'sedan', 'teal'), car('B', 'S', 'straight', 'hatch', 'brick')],
  roads: { kind: 'equal' },
  options: OPTIONS_3,
  correctOptionId: 'a_first',
  explanationsByOption: {
    a_first: ok(
      'გზები თანაბარმნიშვნელოვანია. B ჩრდილოეთისკენ მიდის და მისი მარჯვენა მხარე აღმოსავლეთია — იქიდან შენ მოდიხარ. ამიტომ B გითმობს გზას.',
    ),
    b_first: {
      titleKa: 'აქ შენ ხარ მარჯვნიდან მომავალი',
      bodyKa:
        'B-სთვის შენ მარჯვნივ ხარ: ის ჩრდილოეთისკენ მიდის, შენ კი აღმოსავლეთიდან მოდიხარ. თანაბარმნიშვნელოვან გზებზე ამ შემთხვევაში B უთმობს გზას. ყოველთვის ორივე მძღოლის მხრიდან შეხედე.',
    },
    together: {
      titleKa: 'ერთსა და იმავე ზოლში შედიხართ',
      bodyKa:
        'მარჯვნივ მოხვევის შემდეგ იმ ზოლში ხვდები, რომლითაც B მიდის. ერთდროულად ვერ იმოძრავებთ; რადგან B-სთვის შენ მარჯვნივ ხარ, პირველი შენ გადიხარ.',
    },
  },
  decisiveRuleKa: 'თანაბარმნიშვნელოვან გზებზე მარჯვნიდან მომავალს აქვს უპირატესობა — აქ ეს შენ ხარ.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'A',
    yieldingVehicleId: 'B',
    decisiveSignIds: [],
    relation: { fromVehicleId: 'B', toVehicleId: 'A', labelKa: A_ON_B_RIGHT },
  },
  source: { ruleId: 'R36-4c' },
});

const X3 = scenario({
  id: 'ch1-X3-left-turn-north',
  ruleId: 'R36-4d',
  mode: 'alternate',
  titleKa: 'მარცხნივ მოხვევა ჩრდილოეთიდან',
  promptKa: 'შენ (A) ჩრდილოეთიდან მოდიხარ და მარცხნივ, აღმოსავლეთისკენ უხვევ. B სამხრეთიდან მოდის და პირდაპირ, ჩრდილოეთისკენ მიდის.',
  roadStatusKa: EQUAL_STATUS,
  vehicles: [car('A', 'N', 'left', 'hatch', 'yellow'), car('B', 'S', 'straight', 'suv', 'green')],
  roads: { kind: 'equal' },
  options: OPTIONS_3,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'მარცხნივ მოხვევისას შემხვედრს უთმობ',
      bodyKa: 'შენ მარცხნივ უხვევ, B კი საპირისპირო მიმართულებიდან პირდაპირ მიდის. მოხვევისას მის ზოლს კვეთ, ამიტომ ჯერ B-ს ატარებ.',
    },
    b_first: ok('B შემხვედრია და პირდაპირ მიდის. მარცხნივ მოხვევისას მას უთმობ გზას და მოხვევას მისი გავლის შემდეგ ასრულებ.'),
    together: {
      titleKa: 'მარცხნივ მოხვევა შემხვედრის გზას კვეთს',
      bodyKa: 'მოხვევისას შენი ტრაექტორია B-ს ზოლს კვეთს, ამიტომ ერთდროულად მოძრაობა საფრთხეს ქმნის. ჯერ B გადის.',
    },
  },
  decisiveRuleKa: 'მარცხნივ მოხვევისას გზას უთმობ შემხვედრს, რომელიც პირდაპირ მიდის ან მარჯვნივ უხვევს.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'B',
    yieldingVehicleId: 'A',
    decisiveSignIds: [],
    relation: { fromVehicleId: 'A', toVehicleId: 'B', labelKa: ONCOMING_LABEL },
  },
  source: { ruleId: 'R36-4d' },
});

const X4 = scenario({
  id: 'ch1-X4-main-bends-west',
  ruleId: 'R36-4b',
  mode: 'alternate',
  titleKa: 'მთავარი გზა სამხრეთიდან დასავლეთისკენ',
  promptKa: 'შენ (A) დასავლეთიდან მოდიხარ და პირდაპირ, აღმოსავლეთისკენ მიდიხარ. B სამხრეთიდან მოდის და პირდაპირ, ჩრდილოეთისკენ მიდის.',
  roadStatusKa: SIGNS_STATUS,
  vehicles: [car('A', 'W', 'straight', 'hatch', 'teal'), car('B', 'S', 'straight', 'sedan', 'white')],
  roads: { kind: 'main', mainArms: ['S', 'W'] },
  options: OPTIONS_3,
  correctOptionId: 'b_first',
  explanationsByOption: {
    a_first: {
      titleKa: 'ორივე მთავარ გზაზე ხართ',
      bodyKa:
        'ორივეს წინ ნიშანია „მთავარი გზა“ დაფით: მთავარი გზა სამხრეთიდან დასავლეთისკენ უხვევს. თქვენ შორის თანაბარმნიშვნელოვანი გზების წესი მოქმედებს — აღმოსავლეთისკენ მოძრაობისას შენი მარჯვენა მხარე სამხრეთია, საიდანაც B მოდის.',
    },
    b_first: ok('ორივე მთავარ გზაზე ხართ, რომელიც მიმართულებას იცვლის. თქვენ შორის მარჯვნიდან მომავალის წესი მოქმედებს და B შენგან მარჯვნივ არის.'),
    together: {
      titleKa: 'ტრაექტორიები იკვეთება',
      bodyKa: 'შენი და B-ს გზები გზაჯვარედინზე იკვეთება. ერთ-ერთმა უნდა დაუთმოს: ორივე მთავარ გზაზე ხართ და B შენგან მარჯვნივ არის.',
    },
  },
  decisiveRuleKa: 'მთავარ გზაზე, რომელიც მიმართულებას იცვლის, მძღოლები ერთმანეთს შორის მარჯვნიდან მომავალის წესს იცავენ.',
  conflicts: [['A', 'B']],
  highlight: {
    priorityVehicleId: 'B',
    yieldingVehicleId: 'A',
    decisiveSignIds: ['sign-W', 'sign-S'],
    relation: { fromVehicleId: 'A', toVehicleId: 'B', labelKa: RIGHT_LABEL },
  },
  source: { ruleId: 'R36-4b', supportingRuleIds: ['R36-4c'] },
});

export const CH1_SCENARIOS: Scenario[] = [L1, L2, L3, L4, G1, G2, G3, G4, T1, T2, T3, T4, X1, X2, X3, X4];
