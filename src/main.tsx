import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/noto-sans-georgian/georgian-400.css';
import '@fontsource/noto-sans-georgian/georgian-500.css';
import '@fontsource/noto-sans-georgian/georgian-600.css';
import '@fontsource/noto-sans-georgian/georgian-700.css';
import '@fontsource/noto-sans-georgian/latin-400.css';
import '@fontsource/noto-sans-georgian/latin-600.css';
import '@fontsource/noto-sans-georgian/latin-700.css';
import './styles.css';
import { App } from './App';
import { ACTIVE_CHAPTER } from './content/registry';
import { validateChapter } from './content/validate';
import { ProgressProvider } from './progress/ProgressContext';

if (import.meta.env.DEV) {
  const errors = validateChapter(ACTIVE_CHAPTER);
  if (errors.length) console.error('Content validation failed:\n' + errors.join('\n'));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </StrictMode>,
);
