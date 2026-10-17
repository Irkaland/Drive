import { ACTIVE_CHAPTER } from '../content/registry';
import type { ChapterManifest, Scenario } from '../content/types';
import type { Route } from '../hooks/useRoute';
import { firstAttemptFor } from '../progress/progress';
import type { ProgressData } from '../progress/storage';

/** Chapter navigation helpers shared by several screens. */

/** Where „გააგრძელე“ should take a returning learner. */
export function nextStep(chapter: ChapterManifest, data: ProgressData): Route {
  const li = chapter.lessons.findIndex((l) => !data.completedLessons.includes(l.scenarioId));
  if (li >= 0) return { name: 'lesson', index: li };
  for (const id of [...chapter.guidedIds, ...chapter.independentIds]) {
    const s = chapter.scenarios.find((x) => x.id === id);
    if (s && !firstAttemptFor(data, s)) return { name: 'exercise', scenarioId: id };
  }
  return { name: 'results' };
}

export function chapterProgress(chapter: ChapterManifest, data: ProgressData): { done: number; total: number } {
  const lessons = chapter.lessons.filter((l) => data.completedLessons.includes(l.scenarioId)).length;
  const ex = [...chapter.guidedIds, ...chapter.independentIds].filter((id) => {
    const s = chapter.scenarios.find((x) => x.id === id);
    return s ? !!firstAttemptFor(data, s) : false;
  }).length;
  return { done: lessons + ex, total: chapter.lessons.length + chapter.guidedIds.length + chapter.independentIds.length };
}

export interface SectionInfo {
  label: string;
  position?: { index: number; total: number };
  next: Route;
  nextLabel: string;
}

export function sectionInfo(scenario: Scenario): SectionInfo {
  const c = ACTIVE_CHAPTER;
  const gi = c.guidedIds.indexOf(scenario.id);
  const ii = c.independentIds.indexOf(scenario.id);
  if (gi >= 0) {
    const nextId = c.guidedIds[gi + 1] ?? c.independentIds[0];
    return {
      label: 'მართვადი ვარჯიში',
      position: { index: gi, total: c.guidedIds.length },
      next: nextId ? { name: 'exercise', scenarioId: nextId } : { name: 'results' },
      nextLabel: gi + 1 < c.guidedIds.length ? 'შემდეგი ამოცანა' : 'დამოუკიდებელ ამოცანებზე გადასვლა',
    };
  }
  if (ii >= 0) {
    const nextId = c.independentIds[ii + 1];
    return {
      label: 'დამოუკიდებელი ამოცანა',
      position: { index: ii, total: c.independentIds.length },
      next: nextId ? { name: 'exercise', scenarioId: nextId } : { name: 'results' },
      nextLabel: nextId ? 'შემდეგი ამოცანა' : 'შედეგების ნახვა',
    };
  }
  return { label: 'დამატებითი ვარჯიში', next: { name: 'results' }, nextLabel: 'შედეგებზე დაბრუნება' };
}

