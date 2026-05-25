import { Building2, CalendarDays, RotateCcw, SearchCheck } from "lucide-react";
import type { ReactNode } from "react";
import { guidanceToneClass, inquiriesGuidance } from "@/lib/credit-guidance";
import { copy, type Language } from "@/lib/i18n";
import type { Inquiry } from "@/lib/types";

type InquiriesPanelProps = {
  inquiries: Inquiry[];
  language: Language;
};

export function InquiriesPanel({ inquiries, language }: InquiriesPanelProps) {
  const labels = copy[language].inquiries;
  const activeInquiries = inquiries.filter((inquiry) => inquiry.active);
  const guidance = inquiriesGuidance(activeInquiries.length, language);

  return (
    <section className="mac-panel-strong rounded-[1.25rem] p-3 sm:rounded-[1.6rem] sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--blue)] sm:text-xs sm:tracking-[0.16em]">{labels.title}</p>
          <h3 className="mt-0.5 font-[var(--font-display)] text-xl font-semibold leading-tight sm:mt-1 sm:text-[1.65rem]">{activeInquiries.length}</h3>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#edf4ff] text-[var(--blue)] sm:h-10 sm:w-10 sm:rounded-2xl">
          <SearchCheck className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </div>
      </div>
      <p className={`mt-2 rounded-2xl px-2.5 py-1.5 text-xs font-bold leading-4 sm:px-3 ${guidanceToneClass(guidance.tone)}`}>{guidance.text}</p>
      <div className="mt-2 grid gap-1.5 sm:mt-3">
        {activeInquiries.length > 0 ? (
          activeInquiries.map((inquiry) => <InquiryRow inquiry={inquiry} language={language} key={`${inquiry.date}-${inquiry.resetDate}`} />)
        ) : (
          <p className="rounded-2xl bg-white/60 p-2.5 text-xs leading-5 text-[var(--muted)] sm:p-3 sm:text-sm">{labels.empty}</p>
        )}
      </div>
    </section>
  );
}

function InquiryRow({ inquiry, language }: { inquiry: Inquiry; language: Language }) {
  const labels = copy[language].inquiries;

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white/70 px-2.5 py-2 sm:px-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(160px,1fr)_auto_auto_auto] sm:items-center sm:gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[var(--olive)]">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="truncate text-sm font-bold leading-none">{inquiry.requester || labels.requesterUnknown}</p>
        </div>
        <InquiryDate icon={<CalendarDays className="h-3.5 w-3.5 text-[var(--blue)]" aria-hidden="true" />} label={labels.madeOn} value={inquiry.date} />
        <InquiryDate icon={<RotateCcw className="h-3.5 w-3.5 text-[var(--olive)]" aria-hidden="true" />} label={labels.resetOn} value={inquiry.resetDate} />
        <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold leading-none text-[var(--olive)] sm:justify-self-end">{inquiry.active ? labels.active : labels.expired}</span>
      </div>
    </article>
  );
}

function InquiryDate({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <p className="flex items-center gap-1.5 whitespace-nowrap text-xs leading-none text-[var(--muted)]">
      {icon}
      <span>{label}</span>
      <span className="numeric font-bold text-[var(--ink)]">{value}</span>
    </p>
  );
}
