import type { ReactNode } from "react";

type MetricProps = {
  label: string;
  value: string;
  icon: ReactNode;
  hint?: string;
  hintTone?: "good" | "info" | "warning" | "danger";
  tone?: "default" | "good" | "warning";
};

export function Metric({ label, value, icon, hint, hintTone = "info", tone = "default" }: MetricProps) {
  return (
    <div className="mac-panel-strong grid min-h-[4.35rem] place-items-center rounded-[1.05rem] p-2 text-center transition-transform duration-200 hover:-translate-y-0.5 sm:min-h-[6.1rem] sm:rounded-[1.25rem] sm:p-3 xl:min-h-[6.8rem]">
      <div className="flex w-full items-center justify-center gap-1.5 text-[var(--muted)]">
        <span className="min-w-0 text-center text-[0.52rem] font-bold uppercase leading-3 tracking-[0.08em] sm:text-[0.62rem] sm:leading-4 sm:tracking-[0.12em]">{label}</span>
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg [&_svg]:h-3.5 [&_svg]:w-3.5 sm:h-7 sm:w-7 sm:rounded-xl sm:[&_svg]:h-4 sm:[&_svg]:w-4 ${toneClass(tone)}`}>{icon}</span>
      </div>
      <p className="numeric mt-1.5 max-w-full whitespace-nowrap text-center font-[var(--font-display)] text-[clamp(1rem,4.5vw,1.35rem)] font-semibold leading-none tracking-tight sm:mt-2 sm:text-[clamp(1.35rem,1.75vw,1.7rem)]">{value}</p>
      {hint && <p className={`mt-2 hidden rounded-xl px-2 py-1 text-center text-[0.68rem] font-bold leading-4 xl:line-clamp-2 xl:block ${hintToneClass(hintTone)}`}>{hint}</p>}
    </div>
  );
}

function toneClass(tone: MetricProps["tone"]): string {
  if (tone === "good") {
    return "bg-emerald-50 text-[var(--olive)]";
  }
  if (tone === "warning") {
    return "bg-red-50 text-[var(--clay)]";
  }
  return "bg-[#edf4ff] text-[var(--blue)]";
}

function hintToneClass(tone: NonNullable<MetricProps["hintTone"]>): string {
  if (tone === "good") {
    return "bg-emerald-50 text-[var(--olive)]";
  }
  if (tone === "warning") {
    return "bg-amber-50 text-[#b7791f]";
  }
  if (tone === "danger") {
    return "bg-red-50 text-[var(--clay)]";
  }
  return "bg-[#edf4ff] text-[var(--blue)]";
}
