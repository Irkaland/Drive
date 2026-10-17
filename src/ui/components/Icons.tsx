/** Small inline SVG icons (decorative; buttons always carry a text label). */
type P = { size?: number };
const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
});

export const IconPlay = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M7 5v14l11-7z" fill="currentColor" stroke="none" />
  </svg>
);
export const IconPause = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M8 5v14M16 5v14" strokeWidth={3} />
  </svg>
);
export const IconReplay = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 12a8 8 0 1 0 2.3-5.6" />
    <path d="M4 4v4h4" />
  </svg>
);
export const IconStepNext = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M6 5l8 7-8 7z" fill="currentColor" stroke="none" />
    <path d="M18 5v14" strokeWidth={2.6} />
  </svg>
);
export const IconStepPrev = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M18 5l-8 7 8 7z" fill="currentColor" stroke="none" />
    <path d="M6 5v14" strokeWidth={2.6} />
  </svg>
);
export const IconCheck = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth={2.6} />
  </svg>
);
export const IconInfo = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.5" />
  </svg>
);
export const IconArrowRight = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconArrowLeft = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const IconBook = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 19V5" />
  </svg>
);
export const IconDot = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
  </svg>
);
export const IconRetry = IconReplay;
