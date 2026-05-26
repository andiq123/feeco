"use client";

import { BatchReportView } from "@/components/batch-report-view";
import { IntroAnimation } from "@/components/intro-animation";
import { ReportView } from "@/components/report-view";
import { StatisticsWidget } from "@/components/statistics-widget";
import { UploadPanel } from "@/components/upload-panel";
import { useCreditReportAnalysis } from "@/hooks/use-credit-report-analysis";
import { useStatistics } from "@/hooks/use-statistics";
import { copy, type Language } from "@/lib/i18n";
import type { BatchCreditReport, CreditReport } from "@/lib/types";
import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";

const FALLBACK_TRANSITION_MS = 520;

type PageView =
  | { kind: "upload" }
  | { kind: "report"; report: CreditReport; fileName: string }
  | { kind: "batch"; batchReport: BatchCreditReport; fileName: string };
type FallbackTransitionState = "idle" | "entering";

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => { finished: Promise<void> };
};

export default function Home() {
  const analysis = useCreditReportAnalysis();
  const statistics = useStatistics();
  const [language, setLanguage] = useState<Language>("ro");
  const currentView = useMemo(() => pageViewFromAnalysis(analysis), [analysis.batchReport, analysis.fileName, analysis.report]);
  const [displayedView, setDisplayedView] = useState<PageView>(currentView);
  const [fallbackTransitionState, setFallbackTransitionState] = useState<FallbackTransitionState>("idle");

  useEffect(() => {
    if (samePageView(displayedView, currentView)) {
      return;
    }

    const viewTransition = (document as ViewTransitionDocument).startViewTransition;
    if (viewTransition) {
      const transition = viewTransition.call(document, () => {
        flushSync(() => setDisplayedView(currentView));
        window.scrollTo({ top: 0, behavior: "auto" });
      });
      void transition.finished.catch(() => {});
      return;
    }

    setFallbackTransitionState("entering");
    const timeout = window.setTimeout(() => {
      setDisplayedView(currentView);
      window.scrollTo({ top: 0, behavior: "auto" });
      window.setTimeout(() => setFallbackTransitionState("idle"), FALLBACK_TRANSITION_MS);
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [currentView, displayedView]);

  const shellClassName = `page-view-shell ${pageTransitionClassName(fallbackTransitionState, analysis.isLoading)}`;
  const rejectedFilesToast = <RejectedFilesToast files={analysis.rejectedFiles} language={language} />;

  if (displayedView.kind === "batch") {
    return (
      <>
        {rejectedFilesToast}
        <div className={shellClassName} key={`batch-${displayedView.fileName}`}>
          <BatchReportView batchReport={displayedView.batchReport} fileName={displayedView.fileName} language={language} onLanguageChange={setLanguage} onReturn={analysis.reset} />
        </div>
      </>
    );
  }

  if (displayedView.kind === "report") {
    return (
      <>
        {rejectedFilesToast}
        <div className={shellClassName} key={`report-${displayedView.fileName}`}>
          <ReportView report={displayedView.report} fileName={displayedView.fileName} language={language} onLanguageChange={setLanguage} onReturn={analysis.reset} />
        </div>
      </>
    );
  }

  return (
    <>
      {rejectedFilesToast}
      <main className={`min-h-screen px-3 py-3 text-[var(--ink)] sm:px-6 sm:py-5 lg:px-8 ${shellClassName}`} key="upload">
        <IntroAnimation />
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="min-w-0">
            <UploadPanel
              fileName={analysis.fileName}
              fileCount={analysis.fileCount}
              parsingFiles={analysis.parsingFiles}
              error={analysis.error}
              isBackendAvailable={analysis.isBackendAvailable}
              isLoading={analysis.isLoading}
              language={language}
              onLanguageChange={setLanguage}
              onAnalyze={analysis.analyzeBatch}
            />
          </div>
          <StatisticsWidget language={language} statistics={statistics} />
        </div>
      </main>
    </>
  );
}

function RejectedFilesToast({ files, language }: { files: string[]; language: Language }) {
  if (files.length === 0) {
    return null;
  }

  const labels = copy[language].upload;
  const fileList = files.join(", ");

  return (
    <div className="fixed inset-x-3 top-3 z-[70] mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-[rgba(224,93,93,0.22)] bg-white/96 p-3 text-sm text-[var(--ink)] shadow-[0_18px_52px_rgba(39,62,92,0.18)] backdrop-blur-xl sm:right-5 sm:left-auto sm:top-5" role="status" aria-live="polite">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff1f1] text-[var(--clay)]">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-black leading-5">{labels.rejectedReportTitle}</p>
        <p className="mt-0.5 text-xs font-bold leading-5 text-[var(--muted)]">{labels.rejectedReportBody(fileList)}</p>
      </div>
    </div>
  );
}

function pageViewFromAnalysis(analysis: ReturnType<typeof useCreditReportAnalysis>): PageView {
  if (analysis.batchReport) {
    return { kind: "batch", batchReport: analysis.batchReport, fileName: analysis.fileName };
  }

  if (analysis.report) {
    return { kind: "report", report: analysis.report, fileName: analysis.fileName };
  }

  return { kind: "upload" };
}

function samePageView(left: PageView, right: PageView): boolean {
  if (left.kind !== right.kind) {
    return false;
  }

  if (left.kind === "upload" || right.kind === "upload") {
    return true;
  }

  return left.fileName === right.fileName;
}

function pageTransitionClassName(phase: FallbackTransitionState, isLoading: boolean): string {
  if (phase === "entering") {
    return "page-view-shell--fallback-entering";
  }

  return isLoading ? "page-view-shell--parsing" : "page-view-shell--ready";
}
