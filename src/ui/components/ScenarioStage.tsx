import { useMemo, type ReactNode } from 'react';
import type { Scenario } from '../../content/types';
import { currentStepIndex } from '../../engine/playback';
import { LEAD_IN, frozenPositions, sampleTimeline, type ScenarioMotion, type Timeline } from '../../engine/timeline';
import { usePlayback } from '../../hooks/usePlayback';
import { Scene, type RevealLevel } from '../../render/Scene';
import { SignInset } from '../../render/SignInset';
import { describeScene } from '../describe';
import { MotionToggle } from './MotionToggle';
import { IconPause, IconPlay, IconReplay, IconStepNext, IconStepPrev } from './Icons';

interface Props {
  scenario: Scenario;
  motion: ScenarioMotion;
  /** null → vehicles frozen at their approach positions (question phase). */
  timeline: Timeline | null;
  reveal: RevealLevel;
  autoplay: boolean;
  reducedMotion: boolean;
  /** Rendered directly under the scene, above the playback controls (e.g. timeline tabs). */
  toolbar?: ReactNode;
  /** Side panel: prompt, question, answers. Sits beside the scene on wide screens. */
  panel: ReactNode;
  /** Rendered below the scene and controls: feedback after submission. */
  below?: ReactNode;
}

/**
 * Layout for one scenario: scene (+ controls), side panel, and the area
 * below the scene with feedback, step captions, sign inset and a text
 * description. DOM order = reading order on narrow screens.
 */
export function ScenarioStage({ scenario, motion, timeline, reveal, autoplay, reducedMotion, toolbar, panel, below }: Props) {
  const [pb, dispatch] = usePlayback(timeline, { autoplay, reducedMotion });
  const positions = useMemo(
    () => (timeline ? sampleTimeline(timeline, motion.paths, pb.t) : frozenPositions(motion.paths)),
    [timeline, motion.paths, pb.t],
  );
  const description = useMemo(() => describeScene(scenario), [scenario]);
  const stepIdx = currentStepIndex(pb);
  const atStart = pb.t <= LEAD_IN * 0.6;
  const moving = !!timeline && pb.t > LEAD_IN * 0.6 && pb.t < pb.duration - 0.01;
  const showConflict = !!timeline && timeline.kind === 'proposal' && pb.t >= (timeline.conflictMarkerFrom ?? Infinity);
  const ended = pb.t >= pb.duration - 1e-3;

  return (
    <div className={below ? "stage-grid has-feedback" : "stage-grid"}>
      <div className="stage-scene">
        <div className="scene-frame">
          <Scene
            scenario={scenario}
            motion={motion}
            positions={positions}
            reveal={reveal}
            showRelation={atStart || !timeline}
            showConflictMarker={showConflict}
            routesFaded={moving}
            title={`${scenario.titleKa} — ზემოდან ხედი`}
            description={description}
          />
        </div>
        {toolbar}
        {timeline && (
          <div className="playback" role="group" aria-label="ანიმაციის მართვა">
            <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'toggle' })}>
              {pb.playing ? <IconPause /> : <IconPlay />}
              <span>{pb.playing ? 'პაუზა' : ended ? 'თავიდან ჩართე' : pb.t <= 1e-6 ? 'ჩართე' : 'გაგრძელება'}</span>
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'replay' })}>
              <IconReplay />
              <span>გაიმეორე</span>
            </button>
            <div className="stepper" role="group" aria-label="ნაბიჯ-ნაბიჯ">
              <span className="stepper-label">ნაბიჯ-ნაბიჯ</span>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => dispatch({ type: 'stepPrev' })}
                disabled={pb.t <= 1e-6}
                aria-label="წინა ნაბიჯი"
              >
                <IconStepPrev />
              </button>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => dispatch({ type: 'stepNext' })}
                disabled={ended}
                aria-label="შემდეგი ნაბიჯი"
              >
                <IconStepNext />
              </button>
            </div>
            <MotionToggle />
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${pb.duration ? (pb.t / pb.duration) * 100 : 0}%` }} />
            </div>
          </div>
        )}
        {timeline && (
          <ol className="captions" aria-label="რა ხდება ანიმაციაში">
            {timeline.steps.map((s, i) => (
              <li
                key={i}
                className={i === stepIdx ? 'is-current' : i < stepIdx ? 'is-past' : undefined}
                aria-current={i === stepIdx ? 'step' : undefined}
              >
                {s.captionKa}
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="stage-panel">{panel}</div>
      <div className="stage-below">
        {below}
        <SignInset scenario={scenario} emphasize={reveal !== 'none'} />
        <details className="text-alt">
          <summary>სცენის ტექსტური აღწერა</summary>
          <p>{description}</p>
        </details>
      </div>
    </div>
  );
}
