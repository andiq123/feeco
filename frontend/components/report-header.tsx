"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { guidanceToneClass, scoreGuidance } from "@/lib/credit-guidance";
import { copy, type Language } from "@/lib/i18n";
import type { CreditReport } from "@/lib/types";

type ReportHeaderProps = {
  report: CreditReport;
  language: Language;
  eyebrow: string;
  date?: string;
  fileName: string;
  scoreChange?: number;
  selectedCountText?: string;
  dateRangeText?: string;
  transitionClass?: string;
  sideContent?: React.ReactNode;
};

export function ReportHeader({
  report,
  language,
  eyebrow,
  date,
  scoreChange,
  transitionClass = "",
  sideContent,
}: ReportHeaderProps) {
  const labels = copy[language];
  const score = displayScore(report);
  const numericScore = report.summary.creditScore || report.summary.healthScore;
  const scoreNote = scoreGuidance(numericScore, language);
  const hasScoreTrend = typeof scoreChange === "number";
  const isGrowing = (scoreChange ?? 0) >= 0;

  return (
    <header className="smooth-layout mac-panel w-full overflow-hidden rounded-[1.35rem] p-3 sm:rounded-[2rem] sm:p-8">
      <div className="smooth-layout grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(460px,1fr)] lg:items-stretch lg:gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(560px,1.1fr)]">
        <div className={`min-w-0 ${transitionClass}`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.62rem] font-bold uppercase leading-3 tracking-[0.12em] text-[var(--olive)] sm:text-xs sm:tracking-[0.18em]">{eyebrow}</p>
            {date && (
              <>
                <span className="hidden h-1 w-1 rounded-full bg-[var(--line)] sm:inline-block" />
                <p className="text-[0.62rem] font-bold uppercase leading-3 tracking-[0.12em] text-[var(--blue)] sm:text-xs sm:tracking-[0.18em]">{date}</p>
              </>
            )}
          </div>
          <h1 className="numeric mt-1 font-[var(--font-display)] text-[3.8rem] font-semibold leading-none tracking-tight sm:mt-2 sm:text-6xl">{score}</h1>
          {hasScoreTrend ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${isGrowing ? "bg-emerald-50 text-[var(--olive)]" : "bg-red-50 text-[var(--clay)]"}`}>
                {isGrowing ? <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                {(scoreChange ?? 0) > 0 ? "+" : ""}
                {scoreChange} {labels.batch.scoreTrend}
              </div>
              {isGrowing && (scoreChange ?? 0) > 0 && <p className="inline-flex rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 sm:px-3 sm:py-2 sm:text-sm">{labels.batch.congratulations}</p>}
            </div>
          ) : (
            <p className="mt-1 text-xs text-[var(--muted)] sm:mt-2 sm:text-sm">{report.summary.creditScore > 0 ? labels.report.scoreLabel : labels.report.healthEstimate}</p>
          )}
          <p className={`mt-2 inline-flex max-w-full rounded-full px-2.5 py-1 text-[0.68rem] font-bold leading-4 sm:mt-3 sm:py-1.5 sm:text-xs ${guidanceToneClass(scoreNote.tone)}`}>{scoreNote.text}</p>
          {report.summary.creditScore > 0 && <ScoreRangeGuide score={report.summary.creditScore} language={language} />}
        </div>
        {sideContent && <div className="hidden min-w-0 lg:flex">{sideContent}</div>}
      </div>
    </header>
  );
}

function ScoreRangeGuide({ score, language }: { score: number; language: Language }) {
  const labels = copy[language].report;
  const safeScore = Math.min(850, Math.max(300, score || 300));
  const markerPosition = ((safeScore - 300) / 550) * 100;
  const labelPosition = Math.min(90, Math.max(10, markerPosition));
  const ranges = [
    { range: labels.weakRange, text: labels.weakRangeText, active: score > 0 && score < 580, tone: "danger", width: "50.9%", color: "#ef6a6a" },
    { range: labels.fairRange, text: labels.fairRangeText, active: score >= 580 && score < 670, tone: "warning", width: "16.4%", color: "#f3b34d" },
    { range: labels.goodRange, text: labels.goodRangeText, active: score >= 670 && score < 740, tone: "good", width: "12.7%", color: "#44b883" },
    { range: labels.veryGoodRange, text: labels.veryGoodRangeText, active: score >= 740 && score < 800, tone: "good", width: "10.9%", color: "#2fb5b4" },
    { range: labels.excellentRange, text: labels.excellentRangeText, active: score >= 800, tone: "good", width: "9.1%", color: "#3777ff" },
  ] as const;
  const activeRange = ranges.find((item) => item.active);

  return (
    <div className="mt-3 max-w-xl rounded-[1.35rem] bg-white/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/65 sm:mt-5 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[var(--blue)]">{labels.scoreRangeTitle}</p>
          <p className="mt-1 text-xs font-black text-[var(--ink)]">
            {activeRange ? `${activeRange.text} · ${activeRange.range}` : labels.currentBand}
          </p>
        </div>
        <p className="numeric rounded-full bg-white/80 px-2.5 py-1 text-xs font-black text-[var(--ink)] shadow-sm">{safeScore}</p>
      </div>
      <div className="relative mt-7 px-1 pb-7">
        <div className="relative h-3 overflow-hidden rounded-full bg-[var(--line)] shadow-[inset_0_1px_2px_rgba(15,23,42,0.12)]">
          {ranges.map((item) => (
            <div className="h-full float-left opacity-85" key={item.range} style={{ width: item.width, backgroundColor: item.color }} />
          ))}
        </div>
        <div className="absolute top-1.5 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-500 ease-out" style={{ left: `${markerPosition}%` }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_10px_28px_rgba(55,119,255,0.28)] ring-2 ring-[var(--blue)]">
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--blue)]" />
          </div>
        </div>
        <div className="absolute left-1 top-7 text-[0.62rem] font-black text-[var(--muted)]">300</div>
        <div className="absolute right-1 top-7 text-[0.62rem] font-black text-[var(--muted)]">850</div>
        {ranges.map((item) => (
          item.active && (
            <div className={`absolute top-7 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-[0.62rem] font-black shadow-sm ${guidanceToneClass(item.tone)}`} key={item.range} style={{ left: `${labelPosition}%` }}>
              {item.text}
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function displayScore(report: CreditReport): string {
  if (report.summary.creditScore > 0) {
    return String(report.summary.creditScore);
  }
  return `${report.summary.healthScore}/100`;
}
