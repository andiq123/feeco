"use client";

import { AccountsTable } from "@/components/accounts-table";
import { InquiriesPanel } from "@/components/inquiries-panel";
import { ReportHeader } from "@/components/report-header";
import { ReportSummaryWidgets } from "@/components/report-summary-widgets";
import { ResultToolbar } from "@/components/result-shell";
import { copy, type Language } from "@/lib/i18n";
import type { CreditReport } from "@/lib/types";

type ReportViewProps = {
  report: CreditReport;
  fileName: string;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onReturn: () => void;
  compact?: boolean;
};

export function ReportView({ report, fileName, language, onLanguageChange, onReturn, compact = false }: ReportViewProps) {
  const labels = copy[language];

  return (
    <div className={compact ? "space-y-2.5 sm:space-y-5" : "mobile-contained mx-auto w-full max-w-[1500px] space-y-2.5 px-2.5 py-2.5 text-[var(--ink)] sm:space-y-5 sm:px-7 sm:py-6 lg:px-10"}>
      {!compact && <ResultToolbar language={language} onLanguageChange={onLanguageChange} onReturn={onReturn} />}
      {!compact && <ReportHeader report={report} fileName={fileName} language={language} eyebrow={labels.report.report} date={report.reportDate} />}
      <ReportSummaryWidgets report={report} language={language} balanceLabel={labels.report.balance} balanceValue={report.summary.totalBalanceRon} />
      <InquiriesPanel inquiries={report.inquiries} language={language} />
      <AccountsTable accounts={report.accounts} language={language} limit={6} />
    </div>
  );
}
