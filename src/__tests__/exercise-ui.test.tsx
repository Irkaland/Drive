import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProgressProvider } from '../progress/ProgressContext';
import { STORAGE_KEY, createMemoryStore, loadProgress, type KeyValueStore } from '../progress/storage';
import { ExerciseScreen } from '../ui/screens/ExerciseScreen';

function setup(scenarioId: string, store: KeyValueStore = createMemoryStore()) {
  const utils = render(
    <ProgressProvider store={store}>
      <ExerciseScreen scenarioId={scenarioId} />
    </ProgressProvider>,
  );
  return { store, ...utils };
}

const option = (text: RegExp) => screen.getByRole('radio', { name: text });
const submit = () => screen.getByRole('button', { name: 'შემოწმება' });

beforeEach(() => {
  // jsdom lacks these browser APIs
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  window.scrollTo = () => {};
});
afterEach(cleanup);

describe('exercise screen', () => {
  it('records exactly one attempt for a rapid double submission', () => {
    const { store } = setup('ch1-G2-equal-right');
    fireEvent.click(option(/ავტომობილი B/));
    const btn = submit();
    act(() => {
      btn.click();
      btn.click();
    });
    expect(loadProgress(store).data.attempts).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'შემოწმება' })).toBeNull();
  });

  it('lets the learner change the selection before checking, and records only the final choice', () => {
    const { store } = setup('ch1-G2-equal-right');
    fireEvent.click(option(/შენი ავტომობილი/));
    fireEvent.click(option(/ავტომობილი B/));
    expect(option(/ავტომობილი B/).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(submit());
    const [a] = loadProgress(store).data.attempts;
    expect(a).toMatchObject({ selectedOptionId: 'b_first', correct: true, firstAttempt: true, assistanceUsed: false });
  });

  it('tracks assistance in guided mode', () => {
    const { store } = setup('ch1-G2-equal-right');
    fireEvent.click(screen.getByRole('button', { name: /გაიხსენე წესი/ }));
    fireEvent.click(option(/შენი ავტომობილი/));
    fireEvent.click(submit());
    expect(loadProgress(store).data.attempts[0]).toMatchObject({ assistanceUsed: true, correct: false });
  });

  it('offers no hint and reveals nothing before submission in independent mode', () => {
    const { container } = setup('ch1-T2-equal-right-rotated');
    expect(screen.queryByRole('button', { name: /გაიხსენე წესი/ })).toBeNull();
    for (const sel of ['.ring-priority', '.ring-yield', '.sign-glow', '.relation', '.main-band', '.answer.is-correct', '.feedback']) {
      expect(container.querySelector(sel), sel).toBeNull();
    }
  });

  it('a retry is stored as a new, non-first attempt and the first answer is preserved', () => {
    const { store } = setup('ch1-T2-equal-right-rotated');
    fireEvent.click(option(/შენი ავტომობილი/));
    fireEvent.click(submit());
    fireEvent.click(screen.getByRole('button', { name: /სცადე ხელახლა/ }));
    fireEvent.click(option(/ავტომობილი B/));
    fireEvent.click(submit());
    const attempts = loadProgress(store).data.attempts;
    expect(attempts.map((a) => [a.selectedOptionId, a.firstAttempt, a.correct])).toEqual([
      ['a_first', true, false],
      ['b_first', false, true],
    ]);
  });

  it('replaying the animation does not create attempts', () => {
    const { store } = setup('ch1-G1-main-road');
    fireEvent.click(option(/შენი ავტომობილი/));
    fireEvent.click(submit());
    fireEvent.click(screen.getByRole('button', { name: /გაიმეორე/ }));
    fireEvent.click(screen.getByRole('button', { name: 'შემდეგი ნაბიჯი' }));
    fireEvent.click(screen.getByRole('button', { name: /პაუზა|გაგრძელება|ჩართე/ }));
    expect(loadProgress(store).data.attempts).toHaveLength(1);
  });

  it('re-opening an answered exercise shows feedback without recording again', () => {
    const store = createMemoryStore();
    const first = setup('ch1-G3-left-turn', store);
    fireEvent.click(option(/ავტომობილი B/));
    fireEvent.click(submit());
    first.unmount();
    setup('ch1-G3-left-turn', store);
    expect(screen.getByRole('heading', { name: 'სწორია' })).toBeTruthy();
    expect(JSON.parse(store.get(STORAGE_KEY)!).attempts).toHaveLength(1);
  });

  it('every wrong option shows its own misconception explanation', () => {
    const { container } = setup('ch1-G4-main-bends');
    fireEvent.click(option(/შენი ავტომობილი/));
    fireEvent.click(submit());
    const t1 = container.querySelector('.feedback h3')?.textContent;
    fireEvent.click(screen.getByRole('button', { name: /სცადე ხელახლა/ }));
    fireEvent.click(option(/ერთდროულად/));
    fireEvent.click(submit());
    const t2 = container.querySelector('.feedback h3')?.textContent;
    expect(t1).toBe('ორივე მთავარ გზაზე ხართ');
    expect(t2).toBe('ტრაექტორიები იკვეთება');
  });
});
