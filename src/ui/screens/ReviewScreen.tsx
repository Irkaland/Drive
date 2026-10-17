import { ACTIVE_CHAPTER } from '../../content/registry';
import { RULES } from '../../content/rules';
import { hrefFor } from '../../hooks/useRoute';
import { computeResults } from '../../progress/progress';
import { useProgress } from '../../progress/ProgressContext';
import { sectionInfo } from '../navigation';

export function ReviewScreen() {
  const { data } = useProgress();
  const c = ACTIVE_CHAPTER;
  const { mistakes } = computeResults(c, data);

  return (
    <section className="page narrow">
      <header className="page-head">
        <p className="eyebrow">{c.titleKa}</p>
        <h1>შეცდომების მიმოხილვა</h1>
        <p className="lead">აქ ჩანს ამოცანები, რომლებშიც პირველი პასუხი არასწორი იყო — შენი პასუხი, სწორი პასუხი და ახსნა.</p>
      </header>
      {mistakes.length === 0 ? (
        <p className="card">შეცდომები ჯერ არ არის. <a href={hrefFor({ name: 'results' })}>შედეგებზე დაბრუნება</a></p>
      ) : (
        <ol className="review-list">
          {mistakes.map((a) => {
            const s = c.scenarios.find((x) => x.id === a.scenarioId);
            if (!s) return null;
            const chosen = s.options.find((o) => o.id === a.selectedOptionId);
            const correct = s.options.find((o) => o.id === s.correctOptionId)!;
            const exp = s.explanationsByOption[a.selectedOptionId];
            return (
              <li key={a.id} className="card review-item">
                <p className="eyebrow">
                  {sectionInfo(s).label} · {RULES[s.ruleId].titleKa}
                </p>
                <h2>{s.titleKa}</h2>
                <p className="prompt">{s.promptKa}</p>
                <dl>
                  <dt>შენი პირველი პასუხი</dt>
                  <dd>{chosen?.labelKa ?? '—'}</dd>
                  <dt>სწორი პასუხი</dt>
                  <dd>{correct.labelKa}</dd>
                </dl>
                {exp && (
                  <p>
                    <strong>{exp.titleKa}.</strong> {exp.bodyKa}
                  </p>
                )}
                <p className="decisive-inline">{s.decisiveRuleKa}</p>
                <a className="btn btn-secondary" href={hrefFor({ name: 'exercise', scenarioId: s.id })}>
                  სცენის და ანიმაციის ნახვა
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
