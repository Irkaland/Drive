import type { ChapterManifest, Scenario } from './types';
import { CH1 } from './chapters/ch1/manifest';

/**
 * Chapter registry. To add a chapter, create `chapters/<id>/manifest.ts`
 * and append it here — the application shell reads everything from this list.
 */
export const CHAPTERS: ChapterManifest[] = [CH1];

export const ACTIVE_CHAPTER: ChapterManifest = CH1;

export function getChapter(id: string): ChapterManifest | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

export function getScenario(chapter: ChapterManifest, id: string): Scenario | undefined {
  return chapter.scenarios.find((s) => s.id === id);
}

export function requireScenario(chapter: ChapterManifest, id: string): Scenario {
  const s = getScenario(chapter, id);
  if (!s) throw new Error(`Unknown scenario ${id} in chapter ${chapter.id}`);
  return s;
}

/** Ordered learning path through a chapter: lessons → guided → independent. */
export type StepRef =
  | { kind: 'lesson'; index: number; scenarioId: string }
  | { kind: 'guided' | 'independent'; index: number; scenarioId: string }
  | { kind: 'results' };

export function chapterSequence(chapter: ChapterManifest): StepRef[] {
  return [
    ...chapter.lessons.map((l, index) => ({ kind: 'lesson' as const, index, scenarioId: l.scenarioId })),
    ...chapter.guidedIds.map((scenarioId, index) => ({ kind: 'guided' as const, index, scenarioId })),
    ...chapter.independentIds.map((scenarioId, index) => ({ kind: 'independent' as const, index, scenarioId })),
    { kind: 'results' as const },
  ];
}
