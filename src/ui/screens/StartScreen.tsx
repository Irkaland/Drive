import { ACTIVE_CHAPTER } from '../../content/registry';
import { navigate } from '../../hooks/useRoute';
import { chapterProgress, nextStep } from '../navigation';
import { useProgress } from '../../progress/ProgressContext';
import { IconArrowRight } from '../components/Icons';
import { MainRoadFace } from '../../render/SignGraphic';
import { ContentNotice, StorageNotice } from '../components/Notices';

export function StartScreen() {
  const { data } = useProgress();
  const c = ACTIVE_CHAPTER;
  const prog = chapterProgress(c, data);
  const started = prog.done > 0;

  return (
    <section className="page start">
      <div className="hero">
        <HeroIllustration />
        <div className="hero-text">
          <p className="eyebrow">Road Logic</p>
          <h1 className="brand-title">გზის ლოგიკა</h1>
          <p className="lead">
            ისწავლე, ვინ გადის გზაჯვარედინზე პირველი და რატომ — ინტერაქტიული სიტუაციებით, რომლებშიც თავად იღებ გადაწყვეტილებას.
          </p>
        </div>
      </div>

      <article className="card chapter-card">
        <p className="eyebrow">აქტიური თავი</p>
        <h2>{c.titleKa}</h2>
        <p className="subtitle">{c.subtitleKa}</p>
        <p>{c.summaryKa}</p>
        <div className="meter" aria-label={`პროგრესი: ${prog.done} / ${prog.total}`}>
          <div className="meter-fill" style={{ width: `${(prog.done / prog.total) * 100}%` }} />
        </div>
        <p className="meta">
          გავლილია {prog.done} / {prog.total}: 4 გაკვეთილი, 4 მართვადი და 4 დამოუკიდებელი ამოცანა.
        </p>
        <div className="actions">
          <button type="button" className="btn btn-primary btn-large" onClick={() => navigate(nextStep(c, data))}>
            <span>{started ? 'გააგრძელე' : 'დაიწყე სწავლა'}</span> <IconArrowRight />
          </button>
          <button type="button" className="btn btn-secondary btn-large" onClick={() => navigate({ name: 'chapter' })}>
            თავის მიმოხილვა
          </button>
        </div>
      </article>

      <StorageNotice />
      <ContentNotice />
    </section>
  );
}

function HeroIllustration() {
  return (
    <svg className="hero-art" viewBox="0 0 200 200" aria-hidden="true">
      <rect width="200" height="200" rx="28" fill="#dfe6dc" />
      <rect x="78" width="44" height="200" fill="#5a6168" />
      <rect y="78" width="200" height="44" fill="#5a6168" />
      <g stroke="#f4f4f0" strokeWidth="2" strokeDasharray="8 7">
        <line x1="100" y1="0" x2="100" y2="70" />
        <line x1="100" y1="130" x2="100" y2="200" />
        <line x1="0" y1="100" x2="70" y2="100" />
        <line x1="130" y1="100" x2="200" y2="100" />
      </g>
      <path d="M111 182 L111 120 Q111 89 80 89 L10 89" fill="none" stroke="#1f7a8c" strokeWidth="3" strokeDasharray="6 5" />
      <rect x="103" y="140" width="16" height="30" rx="5" fill="#2f6fb0" />
      <rect x="106" y="146" width="10" height="6" rx="2" fill="#25323d" />
      <rect x="160" y="81" width="30" height="16" rx="5" fill="#c0533a" />
      <rect x="166" y="84" width="6" height="10" rx="2" fill="#25323d" />
      <g transform="translate(146 146) scale(0.875)">
        <MainRoadFace />
      </g>
    </svg>
  );
}
