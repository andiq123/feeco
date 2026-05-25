"use client";

import { Sparkles, Users, WandSparkles } from "lucide-react";
import { copy, type Language } from "@/lib/i18n";
import type { AppStatistics } from "@/lib/statistics";
import type { ReactNode } from "react";

type StatisticsWidgetProps = {
  language: Language;
  statistics: AppStatistics | null;
};

export function StatisticsWidget({ language, statistics }: StatisticsWidgetProps) {
  const labels = copy[language].upload;
  const parserUses = statistics?.parserUses ?? 0;
  const distinctGuests = statistics?.distinctGuests ?? 0;

  return (
    <aside className="stats-orbit h-fit overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/82 p-2.5 shadow-[0_18px_56px_rgba(39,62,92,0.13)] backdrop-blur-xl lg:sticky lg:top-8">
      <div className="stats-orbit__shine" aria-hidden="true" />
      <div className="flex items-center gap-2">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${statistics ? "stats-live-glow bg-emerald-50 text-[var(--olive)]" : "bg-slate-100 text-[var(--muted)]"}`}>
          <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.58rem] font-black uppercase leading-3 tracking-[0.16em] text-[var(--blue)]">{labels.statisticsTitle}</p>
          <p className="mt-0.5 truncate font-[var(--font-display)] text-lg font-semibold leading-none">Feeco pulse</p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <MetricTile icon={<Users />} label={labels.distinctGuests} value={statistics ? compactNumber(distinctGuests) : "--"} tone="green" />
        <MetricTile icon={<WandSparkles />} label={labels.parserUses(parserUses)} value={statistics ? compactNumber(parserUses) : "--"} tone="blue" />
      </div>
    </aside>
  );
}

function MetricTile({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: "blue" | "green" }) {
  const toneClass = tone === "green" ? "text-[var(--olive)]" : "text-[var(--blue)]";

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[var(--line)] bg-white/74 px-2.5 py-2 shadow-sm shadow-slate-900/5">
      <div className={`shrink-0 ${toneClass} [&_svg]:h-4.5 [&_svg]:w-4.5`}>{icon}</div>
      <div className="min-w-0">
        <p className="numeric text-base font-black leading-none text-[var(--ink)]">{value}</p>
        <p className="mt-0.5 truncate text-[0.62rem] font-bold leading-3 text-[var(--muted)]">{label}</p>
      </div>
    </div>
  );
}

function compactNumber(value: number): string {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
