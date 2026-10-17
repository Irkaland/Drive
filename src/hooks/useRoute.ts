import { useEffect, useState } from 'react';

/**
 * Minimal hash router (works from any static host or sub-folder).
 *   #/                 start
 *   #/chapter          chapter overview
 *   #/lesson/<n>       lesson n (0-based)
 *   #/x/<scenarioId>   exercise (guided, independent or alternate)
 *   #/results          chapter results
 *   #/review           mistake review
 *   #/sources          source and review register
 */
export type Route =
  | { name: 'start' }
  | { name: 'chapter' }
  | { name: 'lesson'; index: number }
  | { name: 'exercise'; scenarioId: string }
  | { name: 'results' }
  | { name: 'review' }
  | { name: 'sources' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  switch (parts[0]) {
    case 'chapter':
      return { name: 'chapter' };
    case 'lesson': {
      const n = Number(parts[1]);
      return Number.isInteger(n) && n >= 0 ? { name: 'lesson', index: n } : { name: 'chapter' };
    }
    case 'x':
      return parts[1] ? { name: 'exercise', scenarioId: parts[1] } : { name: 'chapter' };
    case 'results':
      return { name: 'results' };
    case 'review':
      return { name: 'review' };
    case 'sources':
      return { name: 'sources' };
    default:
      return { name: 'start' };
  }
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'start':
      return '#/';
    case 'lesson':
      return `#/lesson/${route.index}`;
    case 'exercise':
      return `#/x/${encodeURIComponent(route.scenarioId)}`;
    default:
      return `#/${route.name}`;
  }
}

export function navigate(route: Route): void {
  window.location.hash = hrefFor(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
