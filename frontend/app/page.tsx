"use client";

import { BatchReportView } from "@/components/batch-report-view";
import { IntroAnimation } from "@/components/intro-animation";
import { ReportView } from "@/components/report-view";
import { StatisticsWidget } from "@/components/statistics-widget";
import { UploadPanel } from "@/components/upload-panel";
import { useCreditReportAnalysis } from "@/hooks/use-credit-report-analysis";
import { useStatistics } from "@/hooks/use-statistics";
import type { Language } from "@/lib/i18n";
import type { BatchCreditReport, CreditReport } from "@/lib/types";
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

  if (displayedView.kind === "batch") {
    return (
      <div className={shellClassName} key={`batch-${displayedView.fileName}`}>
        <BatchReportView batchReport={displayedView.batchReport} fileName={displayedView.fileName} language={language} onLanguageChange={setLanguage} onReturn={analysis.reset} />
      </div>
    );
  }

  if (displayedView.kind === "report") {
    return (
      <div className={shellClassName} key={`report-${displayedView.fileName}`}>
        <ReportView report={displayedView.report} fileName={displayedView.fileName} language={language} onLanguageChange={setLanguage} onReturn={analysis.reset} />
      </div>
    );
  }

  return (
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
