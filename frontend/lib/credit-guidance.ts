import { formatPercent } from "@/lib/formatters";
import { copy, type Language } from "@/lib/i18n";

type Guidance = {
  text: string;
  tone: "good" | "info" | "warning" | "danger";
};

export function scoreGuidance(score: number, language: Language): Guidance {
  const labels = copy[language].guidance;

  if (score >= 800) {
    return { text: labels.scoreExcellent, tone: "good" };
  }
  if (score >= 740) {
    return { text: labels.scoreVeryGood, tone: "good" };
  }
  if (score >= 670) {
    return { text: labels.scoreGood, tone: "good" };
  }
  if (score >= 580) {
    return { text: labels.scoreFair, tone: "warning" };
  }
  if (score > 0) {
    return { text: labels.scoreWeak, tone: "danger" };
  }
  return { text: labels.scoreUnknown, tone: "info" };
}

export function inquiriesGuidance(count: number, language: Language): Guidance {
  const labels = copy[language].guidance;

  if (count >= 6) {
    return { text: labels.inquiriesHigh(count), tone: "danger" };
  }
  if (count >= 3) {
    return { text: labels.inquiriesMedium(count), tone: "warning" };
  }
  return { text: labels.inquiriesLow, tone: "good" };
}

export function utilizationGuidance(value: number, language: Language): Guidance {
  const labels = copy[language].guidance;

  if (value >= 70) {
    return { text: labels.utilizationHigh(formatPercent(value)), tone: "danger" };
  }
  if (value > 30) {
    return { text: labels.utilizationMedium(formatPercent(value)), tone: "warning" };
  }
  return { text: labels.utilizationLow, tone: "good" };
}

export function pastDueGuidance(value: number, language: Language): Guidance {
  const labels = copy[language].guidance;

  if (value > 0) {
    return { text: labels.pastDuePresent, tone: "danger" };
  }
  return { text: labels.pastDueClean, tone: "good" };
}

export function bankPolicyGuidance(language: Language): Guidance {
  return { text: copy[language].guidance.bankPolicy, tone: "info" };
}

export function guidanceToneClass(tone: Guidance["tone"]): string {
  if (tone === "good") {
    return "bg-emerald-50 text-[var(--olive)]";
  }
  if (tone === "warning") {
    return "bg-amber-50 text-[#b7791f]";
  }
  if (tone === "danger") {
    return "bg-red-50 text-[var(--clay)]";
  }
  return "bg-[#edf4ff] text-[var(--blue)]";
}
