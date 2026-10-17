import { useEffect } from 'react';
import { ACTIVE_CHAPTER } from './content/registry';
import { hrefFor, useRoute, type Route } from './hooks/useRoute';
import { useReducedMotion } from './hooks/useReducedMotion';
import { RecoveredNotice } from './ui/components/Notices';
import { ExerciseScreen } from './ui/screens/ExerciseScreen';
import { LessonScreen } from './ui/screens/LessonScreen';
import { OverviewScreen } from './ui/screens/OverviewScreen';
import { ResultsScreen } from './ui/screens/ResultsScreen';
import { ReviewScreen } from './ui/screens/ReviewScreen';
import { SourcesScreen } from './ui/screens/SourcesScreen';
import { StartScreen } from './ui/screens/StartScreen';

function screenFor(route: Route) {
  switch (route.name) {
    case 'start':
      return <StartScreen />;
    case 'chapter':
      return <OverviewScreen />;
    case 'lesson':
      return <LessonScreen index={route.index} />;
    case 'exercise':
      return <ExerciseScreen scenarioId={route.scenarioId} />;
    case 'results':
      return <ResultsScreen />;
    case 'review':
      return <ReviewScreen />;
    case 'sources':
      return <SourcesScreen />;
  }
}

const TITLES: Record<Route['name'], string> = {
  start: 'გზის ლოგიკა',
  chapter: ACTIVE_CHAPTER.titleKa,
  lesson: 'გაკვეთილი',
  exercise: 'ამოცანა',
  results: 'შედეგები',
  review: 'შეცდომების მიმოხილვა',
  sources: 'წყაროები',
};

export function App() {
  const route = useRoute();
  const reduced = useReducedMotion();

  useEffect(() => {
    document.title = route.name === 'start' ? 'გზის ლოგიკა' : `${TITLES[route.name]} · გზის ლოგიკა`;
  }, [route]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reduced ? 'true' : 'false';
  }, [reduced]);

  const nav: Array<{ route: Route; label: string }> = [
    { route: { name: 'chapter' }, label: 'თავი' },
    { route: { name: 'results' }, label: 'შედეგები' },
    { route: { name: 'sources' }, label: 'წყაროები' },
  ];

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        მთავარ შინაარსზე გადასვლა
      </a>
      <header className="topbar">
        <a className="brand" href={hrefFor({ name: 'start' })} aria-label="გზის ლოგიკა — მთავარი გვერდი">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#1d3b53" />
            <path d="M16 6 L26 16 L16 26 L6 16Z" fill="#fff" />
            <path d="M16 10 L22 16 L16 22 L10 16Z" fill="#f2b705" />
          </svg>
          <span>გზის ლოგიკა</span>
        </a>
        <nav aria-label="მთავარი ნავიგაცია">
          {nav.map((n) => (
            <a key={n.label} href={hrefFor(n.route)} aria-current={route.name === n.route.name ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <RecoveredNotice />
        {screenFor(route)}
      </main>
      <footer className="footer">
        <p>
          „გზის ლოგიკა“ — დამოუკიდებელი სასწავლო პროექტი. არ არის ოფიციალური საგამოცდო მასალა და არ ცვლის ავტოსკოლას ან ინსტრუქტორს.
        </p>
        <p>
          შინაარსი შედარებულია კანონის მოქმედ ტექსტთან, მაგრამ ინსტრუქტორის განხილვა ჯერ არ ჩატარებულა. <a href={hrefFor({ name: 'sources' })}>წყაროები</a>
        </p>
      </footer>
    </div>
  );
}
