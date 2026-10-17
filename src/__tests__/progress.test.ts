import { describe, expect, it } from 'vitest';
import { CH1 } from '../content/chapters/ch1/manifest';
import { requireScenario } from '../content/registry';
import { attemptsFor, completeLesson, computeResults, firstAttemptFor, recordAttempt } from '../progress/progress';
import {
  STORAGE_KEY,
  clearProgress,
  createBrowserStore,
  createMemoryStore,
  emptyProgress,
  loadProgress,
  saveProgress,
  type ProgressData,
} from '../progress/storage';

const G2 = requireScenario(CH1, 'ch1-G2-equal-right');
const T2 = requireScenario(CH1, 'ch1-T2-equal-right-rotated');

let clock = Date.parse('2026-10-17T10:00:00Z');
const now = () => new Date((clock += 1000));

function answer(data: ProgressData, scenario = G2, optionId = 'a_first', id = `s-${clock}`, assistanceUsed = false) {
  return recordAttempt(data, {
    scenario,
    selectedOptionId: optionId,
    correct: optionId === scenario.correctOptionId,
    assistanceUsed,
    submissionId: id,
    now: now(),
  });
}

describe('attempt recording', () => {
  it('marks only the first attempt per scenario as first, and a retry never overwrites it', () => {
    let d = emptyProgress();
    d = answer(d, G2, 'a_first', 'x1').data; // wrong
    d = answer(d, G2, 'b_first', 'x2').data; // corrected retry
    const list = attemptsFor(d, G2);
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ firstAttempt: true, correct: false, selectedOptionId: 'a_first' });
    expect(list[1]).toMatchObject({ firstAttempt: false, correct: true });
    expect(firstAttemptFor(d, G2)?.correct).toBe(false);
  });

  it('stores scenario id, content version, rule, mode, answer, correctness, assistance and timestamp', () => {
    const { attempt } = answer(emptyProgress(), T2, 'b_first', 'meta-1', false);
    expect(attempt).toMatchObject({
      scenarioId: T2.id,
      contentVersion: T2.version,
      ruleId: 'R36-4c',
      mode: 'independent',
      selectedOptionId: 'b_first',
      correct: true,
      firstAttempt: true,
      assistanceUsed: false,
    });
    expect(() => new Date(attempt.timestamp).toISOString()).not.toThrow();
  });

  it('ignores a duplicate submission of the same presentation', () => {
    const a = answer(emptyProgress(), G2, 'a_first', 'dup');
    const b = recordAttempt(a.data, {
      scenario: G2,
      selectedOptionId: 'b_first',
      correct: true,
      assistanceUsed: false,
      submissionId: 'dup',
    });
    expect(b.duplicate).toBe(true);
    expect(b.data).toBe(a.data);
    expect(b.data.attempts).toHaveLength(1);
  });

  it('ignores attempts made for an older content version', () => {
    const d = answer(emptyProgress(), G2, 'a_first', 'v1').data;
    const bumped = { ...G2, version: G2.version + 1 };
    expect(attemptsFor(d, bumped)).toHaveLength(0);
    expect(recordAttempt(d, { scenario: bumped, selectedOptionId: 'b_first', correct: true, assistanceUsed: false, submissionId: 'v2' }).attempt.firstAttempt).toBe(true);
  });

  it('completing a lesson twice records it once', () => {
    const d = completeLesson(completeLesson(emptyProgress(), 'L'), 'L');
    expect(d.completedLessons).toEqual(['L']);
  });
});

describe('chapter results', () => {
  it('counts first-attempt independent accuracy with numerator and denominator, guided separately', () => {
    let d = emptyProgress();
    // independent: T1 correct, T2 wrong then corrected
    d = answer(d, requireScenario(CH1, 'ch1-T1-secondary-right-turn'), 'b_first', 'i1').data;
    d = answer(d, T2, 'a_first', 'i2').data;
    d = answer(d, T2, 'b_first', 'i3').data;
    // guided: G2 wrong with assistance, then retry
    d = answer(d, G2, 'a_first', 'g1', true).data;
    d = answer(d, G2, 'b_first', 'g2').data;
    const r = computeResults(CH1, d);
    expect(r.independent).toEqual({ correct: 1, answered: 2, total: 4 });
    expect(r.guided).toMatchObject({ firstCorrect: 0, answered: 1, total: 4, totalAttempts: 2 });
    expect(r.assistance.count).toBe(1);
    expect(r.assistance.scenarioIds).toEqual([G2.id]);
    expect(r.mistakes.map((m) => m.scenarioId).sort()).toEqual([G2.id, T2.id].sort());
    expect(r.byRule.find((x) => x.ruleId === 'R36-4c')?.needsReview).toBe(true);
    expect(r.byRule.find((x) => x.ruleId === 'R36-4a')?.needsReview).toBe(false);
    expect(r.allIndependentAnswered).toBe(false);
  });

  it('repeating a completed scenario does not raise mastery', () => {
    let d = emptyProgress();
    d = answer(d, T2, 'a_first', 'r1').data;
    for (let i = 0; i < 5; i++) d = answer(d, T2, 'b_first', `r-again-${i}`).data;
    expect(computeResults(CH1, d).independent.correct).toBe(0);
  });
});

describe('persistence', () => {
  it('round-trips through storage', () => {
    const store = createMemoryStore();
    const d = answer(emptyProgress(), G2, 'b_first', 'p1').data;
    saveProgress(store, completeLesson(d, 'ch1-L1-main-secondary'));
    const loaded = loadProgress(store);
    expect(loaded.recovered).toBe(false);
    expect(loaded.data.attempts).toHaveLength(1);
    expect(loaded.data.completedLessons).toEqual(['ch1-L1-main-secondary']);
  });

  it('reloading does not duplicate attempts', () => {
    const store = createMemoryStore();
    let d = answer(emptyProgress(), G2, 'b_first', 'reload-1').data;
    saveProgress(store, d);
    d = loadProgress(store).data;
    saveProgress(store, d);
    expect(loadProgress(store).data.attempts).toHaveLength(1);
  });

  it('recovers from corrupt JSON and keeps a copy of the damaged value', () => {
    const store = createMemoryStore();
    store.set(STORAGE_KEY, '{not json');
    const r = loadProgress(store);
    expect(r.recovered).toBe(true);
    expect(r.data).toEqual(emptyProgress());
    expect(store.get(`${STORAGE_KEY}.corrupt`)).toBe('{not json');
  });

  it('recovers from an unknown schema version', () => {
    const store = createMemoryStore();
    store.set(STORAGE_KEY, JSON.stringify({ schemaVersion: 99, attempts: [] }));
    expect(loadProgress(store)).toEqual({ data: emptyProgress(), recovered: true });
  });

  it('drops malformed and duplicate attempts but keeps valid ones', () => {
    const store = createMemoryStore();
    const good = answer(emptyProgress(), G2, 'b_first', 'ok-1').attempt;
    store.set(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, attempts: [good, good, { id: 'bad' }, 42], completedLessons: ['a', 7], settings: { reduceMotion: 'x' } }),
    );
    const r = loadProgress(store);
    expect(r.recovered).toBe(true);
    expect(r.data.attempts).toEqual([good]);
    expect(r.data.completedLessons).toEqual(['a']);
    expect(r.data.settings.reduceMotion).toBeNull();
  });

  it('falls back to memory when localStorage throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    } as unknown as Storage;
    const store = createBrowserStore(broken);
    expect(store.persistent).toBe(false);
    saveProgress(store, answer(emptyProgress(), G2, 'b_first', 'mem').data);
    expect(loadProgress(store).data.attempts).toHaveLength(1);
  });

  it('falls back to memory when no storage exists', () => {
    expect(createBrowserStore(null).persistent).toBe(false);
  });

  it('switches to memory if a later write fails (quota)', () => {
    let writes = 0;
    const map = new Map<string, string>();
    const flaky = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        writes++;
        if (writes > 2) throw new Error('quota');
        map.set(k, v);
      },
      removeItem: (k: string) => void map.delete(k),
    } as unknown as Storage;
    const store = createBrowserStore(flaky);
    expect(store.persistent).toBe(true);
    saveProgress(store, emptyProgress());
    saveProgress(store, answer(emptyProgress(), G2, 'b_first', 'q').data);
    expect(store.persistent).toBe(false);
    expect(loadProgress(store).data.attempts).toHaveLength(1);
  });

  it('reset clears stored progress', () => {
    const store = createMemoryStore();
    saveProgress(store, answer(emptyProgress(), G2, 'b_first', 'z').data);
    clearProgress(store);
    expect(loadProgress(store)).toEqual({ data: emptyProgress(), recovered: false });
  });
});
