export const ronFormatter = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

export function formatRON(value: number): string {
  return ronFormatter.format(value);
}

export function formatSignedRON(value: number): string {
  if (value === 0) {
    return formatRON(0);
  }
  return `${value > 0 ? "+" : "-"}${formatRON(Math.abs(value))}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}

const reportMonthFormatters = {
  ro: new Intl.DateTimeFormat("ro-RO", { month: "short", year: "numeric" }),
  en: new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }),
};

export function formatReportMonth(value: string, language: "ro" | "en"): string {
  const date = parseIsoDate(value);

  if (!date) {
    return value || "-";
  }

  return capitalizeFirst(reportMonthFormatters[language].format(date).replace(".", ""));
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function capitalizeFirst(value: string): string {
  return value ? `${value[0].toLocaleUpperCase()}${value.slice(1)}` : value;
}
