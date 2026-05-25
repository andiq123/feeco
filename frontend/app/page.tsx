"use client";

import { BatchReportView } from "@/components/batch-report-view";
import { IntroAnimation } from "@/components/intro-animation";
import { ReportView } from "@/components/report-view";
import { UploadPanel } from "@/components/upload-panel";
import { useCreditReportAnalysis } from "@/hooks/use-credit-report-analysis";
import type { Language } from "@/lib/i18n";
import { useState } from "react";

export default function Home() {
  const analysis = useCreditReportAnalysis();
  const [language, setLanguage] = useState<Language>("ro");

  if (analysis.batchReport) {
    return <BatchReportView batchReport={analysis.batchReport} fileName={analysis.fileName} language={language} onLanguageChange={setLanguage} onReturn={analysis.reset} />;
  }

  if (analysis.report) {
    return <ReportView report={analysis.report} fileName={analysis.fileName} language={language} onLanguageChange={setLanguage} onReturn={analysis.reset} />;
  }

  return (
    <main className="min-h-screen px-3 py-3 text-[var(--ink)] sm:px-6 sm:py-5 lg:px-8">
      <IntroAnimation />
      <div className="mx-auto max-w-5xl">
        <UploadPanel
          fileName={analysis.fileName}
          fileCount={analysis.fileCount}
          error={analysis.error}
          isLoading={analysis.isLoading}
          language={language}
          onLanguageChange={setLanguage}
          onAnalyze={analysis.analyzeBatch}
        />
      </div>
    </main>
  );
}
