"use client";

import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { copy, type Language } from "@/lib/i18n";

type ResultToolbarProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onReturn: () => void;
};

export function ResultToolbar({ language, onLanguageChange, onReturn }: ResultToolbarProps) {
  const labels = copy[language];

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="grid gap-3 sm:flex sm:items-center">
        <button className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full bg-white/80 px-3 text-xs font-bold text-[var(--ink)] shadow-sm shadow-slate-900/5 ring-1 ring-[var(--line)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white sm:h-10 sm:px-4 sm:text-sm" type="button" onClick={onReturn}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {labels.common.backToUpload}
        </button>
        <BrandLogo />
      </div>
      <LanguageSwitcher language={language} onChange={onLanguageChange} />
    </div>
  );
}
