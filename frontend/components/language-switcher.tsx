import { Languages } from "lucide-react";
import { languageNames, type Language } from "@/lib/i18n";

type LanguageSwitcherProps = {
  language: Language;
  onChange: (language: Language) => void;
};

export function LanguageSwitcher({ language, onChange }: LanguageSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-2xl border border-[var(--line)] bg-white/70 p-1 shadow-sm shadow-slate-900/5 sm:gap-1">
      <Languages className="ml-1 h-3.5 w-3.5 text-[var(--muted)] sm:ml-2 sm:h-4 sm:w-4" aria-hidden="true" />
      {(["ro", "en"] as const).map((option) => (
        <button
          className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition sm:px-3 sm:py-2 ${
            language === option ? "bg-[var(--ink)] text-white shadow-sm" : "text-[var(--muted)] hover:bg-white"
          }`}
          type="button"
          onClick={() => onChange(option)}
          key={option}
        >
          {languageNames[option]}
        </button>
      ))}
    </div>
  );
}
