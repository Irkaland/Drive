import { useState } from 'react';
import { ACTIVE_CHAPTER } from '../../content/registry';
import { RULES } from '../../content/rules';
import { hrefFor, navigate } from '../../hooks/useRoute';
import { attemptsFor, firstAttemptFor } from '../../progress/progress';
import { useProgress } from '../../progress/ProgressContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { IconArrowRight, IconCheck, IconDot } from '../components/Icons';
import { MotionToggle } from '../components/MotionToggle';
import { StorageNotice } from '../components/Notices';
import { nextStep } from '../navigation';

export function OverviewScreen() {
  const { data, resetAll } = useProgress();
  const c = ACTIVE_CHAPTER;
  const [confirm, setConfirm] = useState(false);
  const lessonsDone = c.lessons.every((l) => data.completedLessons.includes(l.scenarioId));
  const scenario = (id: string) => c.scenarios.find((s) => s.id === id)!;

  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">თავი 1</p>
        <h1>{c.titleKa}</h1>
        <p className="subtitle">{c.subtitleKa}</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate(nextStep(c, data))}>
          <span>გააგრძელე იქიდან, სადაც გაჩერდი</span> <IconArrowRight />
        </button>
      </header>

      <div className="card conditions">
        <h2>სწავლის პირობები</h2>
        <ul>
          {c.conditionsKa.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>

      <div className="overview-grid">
        <section className="card">
          <h2>1. წესები</h2>
          <p className="meta">ოთხი მოკლე გაკვეთილი. ნებისმიერ დროს შეგიძლია დაუბრუნდე.</p>
          <ol className="item-list">
            {c.lessons.map((l, i) => {
              const done = data.completedLessons.includes(l.scenarioId);
              return (
                <li key={l.scenarioId}>
                  <a href={hrefFor({ name: 'lesson', index: i })} className="item-link">
                    <StatusMark state={done ? 'done' : 'todo'} />
                    <span className="item-title">{l.titleKa}</span>
                    <span className="item-sub">{RULES[l.ruleId].articleKa}</span>
                  </a>
                </li>
              );
            })}
          </ol>
          {lessonsDone && (
            <p className="meta">
              გაკვეთილები უკვე გავლილი გაქვს — შეგიძლია გამოტოვო და{' '}
              <a href={hrefFor({ name: 'exercise', scenarioId: c.guidedIds[0]! })}>პირდაპირ ვარჯიშზე გადახვიდე</a>.
            </p>
          )}
        </section>

        <section className="card">
          <h2>2. მართვადი ვარჯიში</h2>
          <p className="meta">თითო ამოცანა თითო წესზე. საჭიროების შემთხვევაში შეგიძლია წესი გაიხსენო.</p>
          <ol className="item-list">
            {c.guidedIds.map((id) => {
              const s = scenario(id);
              const n = attemptsFor(data, s).length;
              return (
                <li key={id}>
                  <a href={hrefFor({ name: 'exercise', scenarioId: id })} className="item-link">
                    <StatusMark state={n > 0 ? 'done' : 'todo'} />
                    <span className="item-title">{s.titleKa}</span>
                    <span className="item-sub">{n > 0 ? `პასუხი გაცემულია` : RULES[s.ruleId].titleKa}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="card">
          <h2>3. დამოუკიდებელი ამოცანები</h2>
          <p className="meta">შეცვლილი სიტუაციები, მინიშნებების გარეშე. ითვლება პირველი პასუხი.</p>
          <ol className="item-list">
            {c.independentIds.map((id, i) => {
              const s = scenario(id);
              const answered = !!firstAttemptFor(data, s);
              return (
                <li key={id}>
                  <a href={hrefFor({ name: 'exercise', scenarioId: id })} className="item-link">
                    <StatusMark state={answered ? 'done' : 'todo'} />
                    <span className="item-title">ამოცანა {i + 1}</span>
                    <span className="item-sub">{answered ? 'პასუხი გაცემულია' : 'ჯერ არ გაგიხსნია'}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="card">
          <h2>4. შედეგები</h2>
          <p className="meta">პირველი მცდელობის შედეგები წესების მიხედვით და შეცდომების მიმოხილვა.</p>
          <a className="btn btn-secondary" href={hrefFor({ name: 'results' })}>
            შედეგების ნახვა
          </a>
        </section>
      </div>

      <section className="card danger-zone">
        <h2>პარამეტრები და პროგრესი</h2>
        <p className="meta">შემცირებული მოძრაობისას ანიმაცია ნაბიჯ-ნაბიჯ იცვლება, უწყვეტი მოძრაობის გარეშე.</p>
        <div className="actions">
          <MotionToggle />
        </div>
        <StorageNotice />
        <button type="button" className="btn btn-danger-outline" onClick={() => setConfirm(true)}>
          პროგრესის წაშლა
        </button>
      </section>

      <ConfirmDialog
        open={confirm}
        title="წავშალოთ პროგრესი?"
        body="წაიშლება ამ ბრაუზერში შენახული ყველა პასუხი და გავლილი გაკვეთილი. ამ მოქმედების გაუქმება შეუძლებელია."
        confirmLabel="დიახ, წაშალე"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          resetAll();
          setConfirm(false);
        }}
      />
    </section>
  );
}

function StatusMark({ state }: { state: 'done' | 'todo' }) {
  return (
    <span className={`status-mark ${state}`} aria-label={state === 'done' ? 'გავლილია' : 'გასავლელია'} role="img">
      {state === 'done' ? <IconCheck size={14} /> : <IconDot size={10} />}
    </span>
  );
}
