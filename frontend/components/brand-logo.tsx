type BrandLogoProps = {
  compact?: boolean;
};

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="img">
          <defs>
            <linearGradient id="feecoMarkGradient" x1="8" y1="7" x2="42" y2="43" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f8fbff" />
              <stop offset="0.44" stopColor="#dbeafe" />
              <stop offset="1" stopColor="#bff4d8" />
            </linearGradient>
            <linearGradient id="feecoTrendGradient" x1="14" y1="33" x2="38" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2ca36f" />
              <stop offset="1" stopColor="#3278ff" />
            </linearGradient>
          </defs>
          <rect className="brand-mark__plate" x="4" y="4" width="40" height="40" rx="14" fill="url(#feecoMarkGradient)" />
          <path className="brand-mark__soft-line" d="M13 33H35" />
          <path className="brand-mark__score-line" d="M14 29L21 23L27 26L36 16" />
          <circle className="brand-mark__dot" cx="36" cy="16" r="3" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="font-[var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)]">Feeco</p>
          <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--olive)]">Credit clarity</p>
        </div>
      )}
    </div>
  );
}
