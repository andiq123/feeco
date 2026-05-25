import { AlertTriangle, CheckCircle2, CircleDollarSign, CreditCard, Lock, SearchCheck } from "lucide-react";
import { Metric } from "@/components/metric";
import { inquiriesGuidance, pastDueGuidance, utilizationGuidance } from "@/lib/credit-guidance";
import { formatPercent, formatRON, formatSignedRON } from "@/lib/formatters";
import { copy, type Language } from "@/lib/i18n";
import type { CreditReport } from "@/lib/types";

type ReportSummaryWidgetsProps = {
  report: CreditReport;
  language: Language;
  balanceLabel: string;
  balanceValue: number;
  signedBalance?: boolean;
};

export function ReportSummaryWidgets({ report, language, balanceLabel, balanceValue, signedBalance = false }: ReportSummaryWidgetsProps) {
  const labels = copy[language];
  const inquiriesNote = inquiriesGuidance(report.summary.inquiryCount, language);
  const utilizationNote = utilizationGuidance(report.summary.utilizationPercent, language);
  const pastDueNote = pastDueGuidance(report.summary.totalPastDueRon, language);

  return (
    <div className="grid min-w-0 grid-cols-3 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(128px,1fr))] sm:gap-2.5 xl:grid-cols-6">
      <Metric label={labels.common.activeCredits} value={String(report.summary.activeAccounts)} icon={<CreditCard />} tone="good" />
      <Metric label={labels.common.closedCredits} value={String(report.summary.closedAccounts)} icon={<Lock />} />
      <Metric label={labels.common.activeInquiries} value={String(report.summary.inquiryCount)} icon={<SearchCheck />} tone={report.summary.inquiryCount > 0 ? "warning" : "good"} hint={inquiriesNote.text} hintTone={inquiriesNote.tone} />
      <Metric label={balanceLabel} value={signedBalance ? formatSignedRON(balanceValue) : formatRON(balanceValue)} icon={<CircleDollarSign />} />
      <Metric label={labels.common.pastDue} value={formatRON(report.summary.totalPastDueRon)} icon={<AlertTriangle />} tone={report.summary.totalPastDueRon > 0 ? "warning" : "good"} hint={pastDueNote.text} hintTone={pastDueNote.tone} />
      <Metric label={labels.common.utilization} value={formatPercent(report.summary.utilizationPercent)} icon={<CheckCircle2 />} hint={utilizationNote.text} hintTone={utilizationNote.tone} />
    </div>
  );
}
