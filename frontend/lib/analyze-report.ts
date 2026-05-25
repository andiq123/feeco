import type { BatchCreditReport, CreditReport } from "@/lib/types";

export async function analyzeCreditReport(file: File): Promise<CreditReport> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as CreditReport;
}

export async function analyzeCreditReportBatch(files: File[]): Promise<BatchCreditReport> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch("/api/analyze/batch", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as BatchCreditReport;
}
