"use client";

import { Activity, Database, Users, WandSparkles } from "lucide-react";
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
    <aside className="mac-panel h-fit overflow-hidden rounded-[1.5rem] p-4 sm:rounded-[1.75rem] lg:sticky lg:top-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[var(--blue)]">{labels.statisticsTitle}</p>
          <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold leading-none">Feeco pulse</h2>
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${statistics ? "bg-emerald-50 text-[var(--olive)]" : "bg-slate-100 text-[var(--muted)]"}`}>
          <Activity className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-[var(--line)] bg-white/70 p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
          <Database className="h-4 w-4" aria-hidden="true" />
          <span>{statistics?.greeting ?? labels.statisticsLoading}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e6edf7]">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--olive),var(--blue))]" style={{ width: statistics ? "72%" : "24%" }} />
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <MetricTile icon={<Users />} label={labels.distinctGuests} value={statistics ? compactNumber(distinctGuests) : "--"} tone="green" />
        <MetricTile icon={<WandSparkles />} label={labels.parserUses} value={statistics ? compactNumber(parserUses) : "--"} tone="blue" />
      </div>
    </aside>
  );
}

function MetricTile({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: "blue" | "green" }) {
  const toneClass = tone === "green" ? "bg-emerald-50 text-[var(--olive)]" : "bg-[#edf4ff] text-[var(--blue)]";

  return (
    <div className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--line)] bg-white/75 p-3 shadow-sm shadow-slate-900/5">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${toneClass} [&_svg]:h-5 [&_svg]:w-5`}>{icon}</div>
      <div className="min-w-0">
        <p className="numeric text-2xl font-black leading-none text-[var(--ink)]">{value}</p>
        <p className="mt-1 text-[0.72rem] font-bold leading-4 text-[var(--muted)]">{label}</p>
      </div>
    </div>
  );
}

function compactNumber(value: number): string {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
