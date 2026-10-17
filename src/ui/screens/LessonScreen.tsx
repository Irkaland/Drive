import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVE_CHAPTER, requireScenario } from '../../content/registry';
import type { LessonContent } from '../../content/types';
import { evaluateAnswer } from '../../engine/evaluate';
import { buildScenarioMotion } from '../../engine/timeline';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hrefFor, navigate, type Route } from '../../hooks/useRoute';
import { useProgress } from '../../progress/ProgressContext';
import { AnswerOptions } from '../components/AnswerOptions';
import { IconArrowLeft, IconArrowRight, IconInfo, IconRetry } from '../components/Icons';
import { RuleSource } from '../components/RuleSource';
import { ScenarioStage } from '../components/ScenarioStage';

export function LessonScreen({ index }: { index: number }) {
  const lesson = ACTIVE_CHAPTER.lessons[index];
  if (!lesson) {
    return (
      <section className="page narrow">
        <h1>გაკვეთილი ვერ მოიძებნა</h1>
        <a href={hrefFor({ name: 'chapter' })}>თავის მიმოხილვაზე დაბრუნება</a>
      </section>
    );
  }
  return <Lesson key={lesson.scenarioId} lesson={lesson} index={index} />;
}

function Lesson({ lesson, index }: { lesson: LessonContent; index: number }) {
  const scenario = requireScenario(ACTIVE_CHAPTER, lesson.scenarioId);
  const { data, completeLesson } = useProgress();
  const reducedMotion = useReducedMotion();
  const motion = useMemo(() => buildScenarioMotion(scenario), [scenario]);
  const total = ACTIVE_CHAPTER.lessons.length;
  const done = data.completedLessons.includes(scenario.id);

  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);
  const [view, setView] = useState<'proposal' | 'correct'>('correct');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (answered) headingRef.current?.focus();
  }, [answered]);

  const evaluation = answered ? evaluateAnswer(scenario, answered) : null;
  const check = () => {
    if (!selected || answered) return;
    setAnswered(selected);
    setView(evaluateAnswer(scenario, selected).correct ? 'correct' : 'proposal');
    completeLesson(scenario.id);
  };
  const again = () => {
    setAnswered(null);
    setSelected(null);
  };

  const prev: Route = index > 0 ? { name: 'lesson', index: index - 1 } : { name: 'chapter' };
  const next: Route =
    index + 1 < total ? { name: 'lesson', index: index + 1 } : { name: 'exercise', scenarioId: ACTIVE_CHAPTER.guidedIds[0]! };

  const timeline = !evaluation ? null : view === 'proposal' && !evaluation.correct ? motion.proposals[evaluation.option.id] ?? motion.correct : motion.correct;

  const panel = (
    <div className="panel">
      <div className="lesson-text">
        <p className="lesson-lead">{lesson.explanationKa}</p>
        <ul className="points">
          {lesson.pointsKa.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <div className="lesson-try">
        <p className="prompt">{scenario.promptKa}</p>
        <p className="road-status">
          <IconInfo size={16} /> <span>{scenario.roadStatusKa}</span>
        </p>
        <AnswerOptions
          name={`lesson-${scenario.id}`}
          legend={scenario.questionKa}
          options={scenario.options}
          selected={selected}
          onSelect={setSelected}
          locked={!!answered}
          correctOptionId={answered ? scenario.correctOptionId : undefined}
        />
        {!answered && (
          <button type="button" className="btn btn-primary btn-block" onClick={check} disabled={!selected}>
            შემოწმება
          </button>
        )}
      </div>
      <RuleSource ruleId={scenario.ruleId} supporting={scenario.source.supportingRuleIds} status={scenario.reviewStatus} />
    </div>
  );

  const below = evaluation ? (
    <section className={`feedback ${evaluation.correct ? 'is-correct' : 'is-wrong'}`} aria-live="polite">
      <h2 ref={headingRef} tabIndex={-1}>
        {evaluation.correct ? 'სწორია' : 'ჯერ არა — ვნახოთ, რატომ'}
      </h2>
      {!evaluation.correct && <h3>{evaluation.explanation.titleKa}</h3>}
      <p>{evaluation.explanation.bodyKa}</p>
      {!evaluation.correct && <p>{scenario.explanationsByOption[scenario.correctOptionId]!.bodyKa}</p>}
      <div className="decisive">
        <p className="label">გადამწყვეტი წესი</p>
        <p>{scenario.decisiveRuleKa}</p>
      </div>
      <div className="feedback-actions">
        <button type="button" className="btn btn-secondary" onClick={again}>
          <IconRetry /> <span>თავიდან ცდა</span>
        </button>
      </div>
    </section>
  ) : null;

  const toolbar =
    evaluation && !evaluation.correct ? (
      <div className="view-tabs" role="group" aria-label="რომელი მოძრაობა ვაჩვენო">
        <button type="button" className="tab" aria-pressed={view === 'proposal'} onClick={() => setView('proposal')}>
          შენი ვარიანტი
        </button>
        <button type="button" className="tab" aria-pressed={view === 'correct'} onClick={() => setView('correct')}>
          სწორი მოძრაობა
        </button>
      </div>
    ) : null;

  return (
    <section className="page exercise">
      <header className="exercise-head">
        <p className="eyebrow">
          {ACTIVE_CHAPTER.titleKa} · გაკვეთილი {index + 1} / {total}
          {done ? ' · გავლილი' : ''}
        </p>
        <div className="segments" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={i < index ? 'done' : i === index ? 'current' : undefined} />
          ))}
        </div>
        <h1>{lesson.titleKa}</h1>
      </header>
      <ScenarioStage
        scenario={scenario}
        motion={motion}
        timeline={timeline}
        reveal={answered ? 'full' : 'context'}
        autoplay={!!answered}
        reducedMotion={reducedMotion}
        toolbar={toolbar}
        panel={panel}
        below={below}
      />
      <nav className="pager" aria-label="გაკვეთილებს შორის ნავიგაცია">
        <button type="button" className="btn btn-secondary" onClick={() => navigate(prev)}>
          <IconArrowLeft /> <span>{index > 0 ? 'წინა გაკვეთილი' : 'თავის მიმოხილვა'}</span>
        </button>
        <button type="button" className="btn btn-primary" onClick={() => navigate(next)}>
          <span>{index + 1 < total ? 'შემდეგი გაკვეთილი' : 'მართვად ვარჯიშზე გადასვლა'}</span> <IconArrowRight />
        </button>
      </nav>
    </section>
  );
}
