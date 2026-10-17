import type { RuleContent, RuleId, SourceRegisterEntry } from './types';

export const LAW_URL = 'https://matsne.gov.ge/ka/document/view/2169396';
export const LAW_TITLE_KA = 'საქართველოს კანონი „საგზაო მოძრაობის შესახებ“';
export const CONSOLIDATED_VERSION =
  'matsne.gov.ge, კონსოლიდირებული ვერსია (უახლესი კონსოლიდირებული პუბლიკაცია: 25/06/2026)';
export const DATE_CHECKED = '2026-10-17';

/**
 * Official wording is quoted from the consolidated text of Article 36(4)
 * retrieved on DATE_CHECKED. Plain-language text is our own paraphrase.
 */
export const RULES: Record<RuleId, RuleContent> = {
  'R36-4a': {
    id: 'R36-4a',
    titleKa: 'მთავარი და მეორეხარისხოვანი გზა',
    articleKa: 'მუხლი 36, პუნქტი 4, ქვეპუნქტი „ა“',
    plainKa:
      'თუ გზაჯვარედინზე ერთი გზა მთავარია, მეორეხარისხოვან გზაზე მყოფი მძღოლი გზას უთმობს მთავარი გზიდან მომავალ ავტომობილს — სულ ერთია, საით აპირებს ის შემდეგ მოძრაობას და რომელი მხრიდან მოდის.',
    officialTextKa:
      'არათანაბარმნიშვნელოვანი გზების გადაკვეთაზე მეორეხარისხოვან გზაზე მოძრავი სატრანსპორტო საშუალების მძღოლი ვალდებულია გზა დაუთმოს მთავარი გზიდან მოახლოებულ სატრანსპორტო საშუალებას, მიუხედავად მისი შემდგომი მოძრაობის მიმართულებისა;',
  },
  'R36-4b': {
    id: 'R36-4b',
    titleKa: 'მთავარი გზა იცვლის მიმართულებას',
    articleKa: 'მუხლი 36, პუნქტი 4, ქვეპუნქტი „ბ“',
    plainKa:
      'თუ მთავარი გზა გზაჯვარედინზე უხვევს, მთავარ გზაზე მყოფი მძღოლები ერთმანეთს შორის თანაბარმნიშვნელოვანი გზების წესებს იცავენ. ასევე იქცევიან ერთმანეთს შორის მეორეხარისხოვან გზებზე მყოფი მძღოლებიც.',
    officialTextKa:
      'თუ გზაჯვარედინზე მთავარი გზა იცვლის მიმართულებას, ამ გზაზე მოძრავმა მძღოლებმა ურთიერთშორის უნდა იხელმძღვანელონ თანაბარმნიშვნელოვანი გზების გავლის წესებით. ამავე წესებით უნდა იხელმძღვანელონ ურთიერთშორის მეორეხარისხოვან გზაზე მოძრავმა მძღოლებმაც;',
  },
  'R36-4c': {
    id: 'R36-4c',
    titleKa: 'თანაბარმნიშვნელოვანი გზები: მარჯვნიდან მომავალი',
    articleKa: 'მუხლი 36, პუნქტი 4, ქვეპუნქტი „გ“',
    plainKa:
      'თანაბარმნიშვნელოვანი გზების გადაკვეთაზე გზას უთმობ იმ ავტომობილს, რომელიც შენგან მარჯვნიდან გიახლოვდება. „მარჯვნივ“ ნიშნავს მძღოლის მარჯვნივ, მისი მოძრაობის მიმართულებით — არა ეკრანის მარჯვენა მხარეს. რელსიან სატრანსპორტო საშუალებას (მაგ., ტრამვაის) ასეთ გზაჯვარედინზე უპირატესობა აქვს მიმართულების მიუხედავად.',
    officialTextKa:
      'თანაბარმნიშვნელოვანი გზების გადაკვეთაზე ურელსო სატრანსპორტო საშუალების მძღოლი ვალდებულია გზა დაუთმოს მარჯვნიდან მოახლოებულ სატრანსპორტო საშუალებას. ამავე წესით უნდა იხელმძღვანელონ ურთიერთშორის რელსიანი სატრანსპორტო საშუალებების მძღოლებმაც. ასეთ გზაჯვარედინზე რელსიან სატრანსპორტო საშუალებას აქვს უპირატესობა ურელსო სატრანსპორტო საშუალების მიმართ, მიუხედავად მისი მოძრაობის მიმართულებისა;',
  },
  'R36-4d': {
    id: 'R36-4d',
    titleKa: 'მარცხნივ მოხვევა და შემხვედრი მოძრაობა',
    articleKa: 'მუხლი 36, პუნქტი 4, ქვეპუნქტი „დ“',
    plainKa:
      'მარცხნივ მოხვევისას ან მობრუნებისას გზას უთმობ თანაბარმნიშვნელოვან გზაზე საპირისპირო მიმართულებიდან მომავალ ავტომობილს, რომელიც პირდაპირ მიდის ან მარჯვნივ უხვევს.',
    officialTextKa:
      'მარცხნივ მოხვევისას ან მობრუნებისას ურელსო სატრანსპორტო საშუალების მძღოლი ვალდებულია გზა დაუთმოს თანაბარმნიშვნელოვან გზაზე საპირისპირო მიმართულებიდან პირდაპირ ან მარჯვნივ მოძრავ სატრანსპორტო საშუალებას. ამავე წესით უნდა იხელმძღვანელონ ურთიერთშორის რელსიანი სატრანსპორტო საშუალებების მძღოლებმაც.',
  },
};

const COMMON_NOTE =
  'Official text retrieved from the consolidated version on matsne.gov.ge and compared with the paraphrase. Not reviewed by a qualified driving instructor. Sign artwork and names (2.1 „მთავარი გზა“, 2.3 „დაუთმე გზა“, plate 8.13) were compared with the sign annex of the law (danarti 1-5) on 2026-10-17. Proportions are measured from the annex pictures, which give no dimensions.';

export const SOURCE_REGISTER: SourceRegisterEntry[] = (
  [
    ['R36-4a', 'ა'],
    ['R36-4b', 'ბ'],
    ['R36-4c', 'გ'],
    ['R36-4d', 'დ'],
  ] as const
).map(([ruleId, sub]) => ({
  ruleId,
  article: '36',
  paragraph: `4(${sub})`,
  sourceUrl: LAW_URL,
  sourceTitle: LAW_TITLE_KA,
  consolidatedVersion: CONSOLIDATED_VERSION,
  dateChecked: DATE_CHECKED,
  paraphraseKa: RULES[ruleId].plainKa,
  reviewStatus: 'source_checked',
  notes: COMMON_NOTE,
}));

export const REVIEW_STATUS_LABEL_KA: Record<SourceRegisterEntry['reviewStatus'], string> = {
  draft: 'სამუშაო ვერსია',
  source_checked: 'შემოწმებულია წყაროსთან',
  instructor_reviewed: 'განხილულია ინსტრუქტორის მიერ',
};

/** Related provisions referenced in lesson text (not tested as separate rules). */
export const ART_36_8_KA =
  'თუ მძღოლი ვერ განსაზღვრავს გზაზე საფრის არსებობას (სიბნელის, თოვლის, ტალახის გამო ან სხვა მიზეზით) და არც პრიორიტეტის ნიშნებია, ითვლება, რომ იგი მეორეხარისხოვან გზაზე იმყოფება.';
