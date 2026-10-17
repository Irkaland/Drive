import { useRef, type KeyboardEvent } from 'react';
import type { AnswerOption } from '../../content/types';
import { IconCheck } from './Icons';

interface Props {
  name: string;
  legend: string;
  options: AnswerOption[];
  selected: string | null;
  onSelect: (id: string) => void;
  /** After submission: lock the group and mark the learner's choice and the correct option. */
  locked: boolean;
  correctOptionId?: string;
}

/**
 * Accessible single-choice group built from buttons with radio semantics.
 * Arrow keys move between options, Space/Enter selects. Nothing reveals the
 * answer until `locked` is set after submission.
 */
export function AnswerOptions({ name, legend, options, selected, onSelect, locked, correctOptionId }: Props) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(0, options.findIndex((o) => o.id === selected));

  const onKey = (e: KeyboardEvent, i: number) => {
    if (locked) return;
    const delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + options.length) % options.length;
    onSelect(options[next]!.id);
    refs.current[next]?.focus();
  };

  return (
    <div className="answers" role="radiogroup" aria-labelledby={`${name}-legend`}>
      <p id={`${name}-legend`} className="answers-legend">
        {legend}
      </p>
      {options.map((o, i) => {
        const isSel = selected === o.id;
        const isCorrect = locked && o.id === correctOptionId;
        const isWrongPick = locked && isSel && o.id !== correctOptionId;
        const cls = ['answer', isSel && 'is-selected', isCorrect && 'is-correct', isWrongPick && 'is-wrong'].filter(Boolean).join(' ');
        return (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSel}
            aria-disabled={locked || undefined}
            tabIndex={i === activeIndex ? 0 : -1}
            className={cls}
            onClick={() => !locked && onSelect(o.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="answer-mark" aria-hidden="true">
              {isCorrect ? <IconCheck size={16} /> : null}
            </span>
            <span className="answer-label">{o.labelKa}</span>
            {locked && isSel && <span className="answer-tag">შენი პასუხი</span>}
            {isCorrect && !isSel && <span className="answer-tag answer-tag-correct">სწორი პასუხი</span>}
          </button>
        );
      })}
    </div>
  );
}
