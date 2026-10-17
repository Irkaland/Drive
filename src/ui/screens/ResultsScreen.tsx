import { ACTIVE_CHAPTER } from '../../content/registry';
import { RULES } from '../../content/rules';
import { hrefFor, navigate } from '../../hooks/useRoute';
import { computeResults, type RuleResult } from '../../progress/progress';
import { useProgress } from '../../progress/ProgressContext';
import type { Attempt } from '../../progress/storage';
import { IconArrowRight } from '../components/Icons';
import { nextStep } from '../navigation';

function Cell({ a }: { a?: Attempt }) {
  if (!a) return <span className="cell cell-none">—</span>;
  return a.correct ? (
    <span className="cell cell-ok">სწორი{a.assistanceUsed ? ' (მინიშნებით)' : ''}</span>
  ) : (
    <span className="cell cell-miss">შეცდომა{a.assistanceUsed ? ' (მინიშნებით)' : ''}</span>
  );
}

export function ResultsScreen() {
  const { data } = useProgress();
  const c = ACTIVE_CHAPTER;
  const r = computeResults(c, data);
  const lessonIndex = (rule: RuleResult['ruleId']) => c.lessons.findIndex((l) => l.ruleId === rule);
  const revisit = r.byRule.filter((x) => x.needsReview);

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">{c.titleKa}</p>
        <h1>შედეგები</h1>
      </header>

      {!r.allIndependentAnswered && (
        <div className="notice" role="status">
          <p>
            დამოუკიდებელი ამოცანებიდან პასუხი გაცემულია {r.independent.answered} / {r.independent.total}. სრული სურათისთვის დაასრულე ყველა.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate(nextStep(c, data))}>
            <span>გაგრძელება</span> <IconArrowRight />
          </button>
        </div>
      )}

      <div className="stats">
        <div className="stat card">
          <p className="stat-label">დამოუკიდებელი ამოცანები — პირველი მცდელობა</p>
          <p className="stat-value">
            {r.independent.correct} <span>/ {r.independent.total}</span>
          </p>
          <p className="meta">სწორი პასუხი პირველივე ცდით. განმეორებითი ცდები აქ არ ითვლება.</p>
        </div>
        <div className="stat card">
          <p className="stat-label">მართვადი ვარჯიში — პირველი მცდელობა</p>
          <p className="stat-value">
            {r.guided.firstCorrect} <span>/ {r.guided.total}</span>
          </p>
          <p className="meta">სულ მცდელობა მართვად ვარჯიშში: {r.guided.totalAttempts}</p>
        </div>
        <div className="stat card">
          <p className="stat-label">წესის მინიშნება</p>
          <p className="stat-value">
            {r.assistance.count} <span>ამოცანაში</span>
          </p>
          <p className="meta">რამდენ ამოცანაში გაიხსენე წესი პასუხამდე.</p>
        </div>
      </div>

      <section className="card">
        <h2>წესების მიხედვით</h2>
        <div className="table-wrap">
          <table className="results-table">
            <thead>
              <tr>
                <th scope="col">წესი</th>
                <th scope="col">მართვადი</th>
                <th scope="col">დამოუკიდებელი</th>
                <th scope="col">დამატებითი</th>
              </tr>
            </thead>
            <tbody>
              {r.byRule.map((x) => (
                <tr key={x.ruleId}>
                  <th scope="row">
                    {RULES[x.ruleId].titleKa}
                    <span className="item-sub">{RULES[x.ruleId].articleKa}</span>
                  </th>
                  <td data-label="მართვადი">
                    <Cell a={x.guided} />
                  </td>
                  <td data-label="დამოუკიდებელი">
                    <Cell a={x.independent} />
                  </td>
                  <td data-label="დამატებითი">
                    <Cell a={x.alternate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="meta">
          ცხრილი აჩვენებს მხოლოდ ამ თავის ამოცანებს. ეს არ არის გამოცდისთვის მზადყოფნის შეფასება.
        </p>
      </section>

      <section className="card">
        <h2>რას გაიმეორებდი</h2>
        {revisit.length === 0 ? (
          <p>{r.independent.answered + r.guided.answered === 0 ? 'ჯერ პასუხები არ გაქვს.' : 'პირველივე ცდით შეცდომა არცერთ წესში არ გქონია.'}</p>
        ) : (
          <ul className="revisit">
            {revisit.map((x) => (
              <li key={x.ruleId}>
                <div>
                  <strong>{RULES[x.ruleId].titleKa}</strong>
                  <p className="meta">{RULES[x.ruleId].plainKa}</p>
                </div>
                <div className="revisit-actions">
                  <a className="btn btn-secondary" href={hrefFor({ name: 'lesson', index: lessonIndex(x.ruleId) })}>
                    გაკვეთილი
                  </a>
                  {x.alternateScenarioId && (
                    <a className="btn btn-primary" href={hrefFor({ name: 'exercise', scenarioId: x.alternateScenarioId })}>
                      სცადე სხვა ვარიანტი
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="actions">
        <a className="btn btn-primary" href={hrefFor({ name: 'review' })}>
          შეცდომების მიმოხილვა ({r.mistakes.length})
        </a>
        <a className="btn btn-secondary" href={hrefFor({ name: 'chapter' })}>
          თავის მიმოხილვა
        </a>
      </div>
    </section>
  );
}
