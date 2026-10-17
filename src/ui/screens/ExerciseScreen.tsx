import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVE_CHAPTER, getScenario } from '../../content/registry';
import { RULES } from '../../content/rules';
import type { Scenario } from '../../content/types';
import { evaluateAnswer } from '../../engine/evaluate';
import { buildScenarioMotion } from '../../engine/timeline';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hrefFor, navigate } from '../../hooks/useRoute';
import { sectionInfo } from '../navigation';
import { attemptsFor, latestAttemptFor } from '../../progress/progress';
import { useProgress } from '../../progress/ProgressContext';
import type { Attempt } from '../../progress/storage';
import { AnswerOptions } from '../components/AnswerOptions';
import { IconArrowRight, IconBook, IconInfo, IconRetry } from '../components/Icons';
import { RuleSource } from '../components/RuleSource';
import { ScenarioStage } from '../components/ScenarioStage';
import type { RevealLevel } from '../../render/Scene';

let submissionCounter = 0;
function newSubmissionId(scenarioId: string): string {
  submissionCounter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${scenarioId}@${Date.now().toString(36)}-${submissionCounter}-${rand}`;
}

export function ExerciseScreen({ scenarioId }: { scenarioId: string }) {
  const scenario = getScenario(ACTIVE_CHAPTER, scenarioId);
  if (!scenario || scenario.mode === 'lesson') {
    return (
      <section className="page narrow">
        <h1>ამოცანა ვერ მოიძებნა</h1>
        <p>
          <a href={hrefFor({ name: 'chapter' })}>თავის მიმოხილვაზე დაბრუნება</a>
        </p>
      </section>
    );
  }
  return <Exercise key={scenario.id} scenario={scenario} />;
}

function Exercise({ scenario }: { scenario: Scenario }) {
  const { data, recordAttempt } = useProgress();
  const reducedMotion = useReducedMotion();
  const motion = useMemo(() => buildScenarioMotion(scenario), [scenario]);
  const info = sectionInfo(scenario);
  const allowHints = scenario.mode === 'guided';

  // A previously answered exercise re-opens on its feedback (no new attempt is created).
  const [shown, setShown] = useState<Attempt | null>(() => latestAttemptFor(data, scenario) ?? null);
  const [selected, setSelected] = useState<string | null>(shown?.selectedOptionId ?? null);
  const [assistance, setAssistance] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [view, setView] = useState<'proposal' | 'correct'>(shown && !shown.correct ? 'proposal' : 'correct');
  const [whyOpen, setWhyOpen] = useState(false);
  const submissionId = useRef(newSubmissionId(scenario.id));
  const locked = useRef(false);
  const feedbackRef = useRef<HTMLHeadingElement>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    if (justSubmitted) feedbackRef.current?.focus();
  }, [justSubmitted]);

  const phase = shown ? 'feedback' : 'question';
  const evaluation = shown ? evaluateAnswer(scenario, shown.selectedOptionId) : null;
  const priorAttempts = attemptsFor(data, scenario);

  const submit = () => {
    if (locked.current || phase !== 'question' || !selected) return;
    locked.current = true;
    const ev = evaluateAnswer(scenario, selected);
    const { attempt } = recordAttempt({
      scenario,
      selectedOptionId: selected,
      correct: ev.correct,
      assistanceUsed: assistance,
      submissionId: submissionId.current,
    });
    setShown(attempt);
    setView(ev.correct ? 'correct' : 'proposal');
    setJustSubmitted(true);
  };

  const retry = () => {
    submissionId.current = newSubmissionId(scenario.id);
    locked.current = false;
    setShown(null);
    setSelected(null);
    setAssistance(false);
    setHintOpen(false);
    setWhyOpen(false);
    setJustSubmitted(false);
  };

  const openHint = () => {
    setHintOpen(true);
    setAssistance(true);
  };

  const reveal: RevealLevel = phase === 'feedback' ? 'full' : hintOpen ? 'context' : 'none';
  const timeline =
    phase === 'question' || !evaluation
      ? null
      : view === 'proposal' && !evaluation.correct
        ? motion.proposals[evaluation.option.id] ?? motion.correct
        : motion.correct;

  const toolbar =
    phase === 'feedback' && evaluation && !evaluation.correct ? (
      <div className="view-tabs" role="group" aria-label="რომელი მოძრაობა ვაჩვენო">
        <button type="button" className="tab" aria-pressed={view === 'proposal'} onClick={() => setView('proposal')}>
          შენი ვარიანტი
        </button>
        <button type="button" className="tab" aria-pressed={view === 'correct'} onClick={() => setView('correct')}>
          სწორი მოძრაობა
        </button>
      </div>
    ) : null;

  const panel = (
    <div className="panel">
      <p className="prompt">{scenario.promptKa}</p>
      <p className="road-status">
        <IconInfo size={16} /> <span>{scenario.roadStatusKa}</span>
      </p>
      <AnswerOptions
        name={`q-${scenario.id}`}
        legend={scenario.questionKa}
        options={scenario.options}
        selected={selected}
        onSelect={setSelected}
        locked={phase === 'feedback'}
        correctOptionId={phase === 'feedback' ? scenario.correctOptionId : undefined}
      />
      {phase === 'question' && (
        <>
          <button type="button" className="btn btn-primary btn-block" onClick={submit} disabled={!selected} aria-disabled={!selected}>
            შემოწმება
          </button>
          {!selected && <p className="hint-text">აირჩიე პასუხი. არჩევანის შეცვლა შეგიძლია შემოწმებამდე.</p>}
          {allowHints ? (
            <div className="assist">
              {!hintOpen ? (
                <button type="button" className="btn btn-secondary btn-block" onClick={openHint}>
                  <IconBook /> <span>გაიხსენე წესი</span>
                </button>
              ) : (
                <div className="assist-card" role="note">
                  <h3>{RULES[scenario.ruleId].titleKa}</h3>
                  <p>{RULES[scenario.ruleId].plainKa}</p>
                  <p className="meta">მინიშნების გამოყენება აღინიშნება შედეგებში.</p>
                </div>
              )}
            </div>
          ) : (
            <p className="hint-text">დამოუკიდებელი ამოცანა: მინიშნებები გამორთულია. ახსნას პასუხის შემოწმების შემდეგ ნახავ.</p>
          )}
        </>
      )}
    </div>
  );

  const below =
    phase === 'feedback' && evaluation ? (
      <section className={`feedback ${evaluation.correct ? 'is-correct' : 'is-wrong'}`} aria-live="polite">
        <h2 ref={feedbackRef} tabIndex={-1}>
          {evaluation.correct ? 'სწორია' : 'ჯერ არა — ვნახოთ, რატომ'}
        </h2>
        <h3>{evaluation.explanation.titleKa === 'სწორია' ? 'რატომ არის ასე' : evaluation.explanation.titleKa}</h3>
        <p>{evaluation.explanation.bodyKa}</p>
        {!evaluation.correct && (
          <div className="correct-answer">
            <p className="label">სწორი პასუხი: {evaluation.correctOption.labelKa}</p>
            <p>{scenario.explanationsByOption[scenario.correctOptionId]!.bodyKa}</p>
          </div>
        )}
        <div className="decisive">
          <p className="label">გადამწყვეტი წესი</p>
          <p>{scenario.decisiveRuleKa}</p>
        </div>
        {shown && !shown.firstAttempt && (
          <p className="meta">ეს განმეორებითი მცდელობაა. პირველი პასუხი შენახულია და შედეგებში სწორედ ის ითვლება.</p>
        )}
        {shown?.assistanceUsed && <p className="meta">ამ მცდელობისას წესის მინიშნება გამოიყენე.</p>}

        <button type="button" className="btn btn-link" aria-expanded={whyOpen} onClick={() => setWhyOpen((v) => !v)}>
          რატომ? {whyOpen ? '— დამალე' : '— ყველა პასუხის ახსნა'}
        </button>
        {whyOpen && (
          <div className="why">
            <ul>
              {scenario.options.map((o) => {
                const e = scenario.explanationsByOption[o.id]!;
                return (
                  <li key={o.id}>
                    <strong>{o.labelKa}</strong>
                    <span className={o.id === scenario.correctOptionId ? 'why-tag ok' : 'why-tag'}>
                      {o.id === scenario.correctOptionId ? 'სწორი' : e.titleKa}
                    </span>
                    <p>{e.bodyKa}</p>
                  </li>
                );
              })}
            </ul>
            <p className="rule-plain">{RULES[scenario.ruleId].plainKa}</p>
          </div>
        )}
        <RuleSource ruleId={scenario.ruleId} supporting={scenario.source.supportingRuleIds} status={scenario.reviewStatus} />

        <div className="feedback-actions">
          <button type="button" className="btn btn-secondary" onClick={retry}>
            <IconRetry /> <span>სცადე ხელახლა</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate(info.next)}>
            <span>{info.nextLabel}</span> <IconArrowRight />
          </button>
        </div>
        {priorAttempts.length > 1 && <p className="meta">ამ ამოცანაზე სულ {priorAttempts.length} მცდელობა გაქვს.</p>}
      </section>
    ) : null;

  return (
    <section className="page exercise">
      <header className="exercise-head">
        <p className="eyebrow">
          {ACTIVE_CHAPTER.titleKa} · {info.label}
          {info.position ? ` ${info.position.index + 1} / ${info.position.total}` : ''}
        </p>
        {info.position && (
          <div className="segments" aria-hidden="true">
            {Array.from({ length: info.position.total }, (_, i) => (
              <span key={i} className={i < info.position!.index ? 'done' : i === info.position!.index ? 'current' : undefined} />
            ))}
          </div>
        )}
        <h1>{scenario.titleKa}</h1>
      </header>
      <ScenarioStage
        scenario={scenario}
        motion={motion}
        timeline={timeline}
        reveal={reveal}
        autoplay={justSubmitted}
        reducedMotion={reducedMotion}
        toolbar={toolbar}
        panel={panel}
        below={below}
      />
    </section>
  );
}
