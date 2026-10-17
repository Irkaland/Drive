import { CONSOLIDATED_VERSION, DATE_CHECKED, LAW_TITLE_KA, LAW_URL, REVIEW_STATUS_LABEL_KA, RULES } from '../../content/rules';
import type { ReviewStatus, RuleId } from '../../content/types';

/** Expandable „წესის წყარო“: official wording, link and review status. */
export function RuleSource({ ruleId, supporting, status }: { ruleId: RuleId; supporting?: RuleId[]; status: ReviewStatus }) {
  const ids = [ruleId, ...(supporting ?? [])];
  return (
    <details className="rule-source">
      <summary>წესის წყარო</summary>
      {ids.map((id) => {
        const r = RULES[id];
        return (
          <div key={id} className="rule-source-item">
            <p className="rule-source-article">
              {LAW_TITLE_KA}, {r.articleKa}
            </p>
            <blockquote lang="ka">{r.officialTextKa}</blockquote>
          </div>
        );
      })}
      <p className="meta">
        <a href={LAW_URL} target="_blank" rel="noopener noreferrer">
          matsne.gov.ge — კანონის ოფიციალური ტექსტი
        </a>
        <br />
        {CONSOLIDATED_VERSION}. შემოწმების თარიღი: {DATE_CHECKED}. სტატუსი: {REVIEW_STATUS_LABEL_KA[status]}.
      </p>
    </details>
  );
}
