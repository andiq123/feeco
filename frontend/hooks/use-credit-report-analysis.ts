"use client";

import { useEffect, useState } from "react";
import { analyzeCreditReport, analyzeCreditReportBatch } from "@/lib/analyze-report";
import type { BatchCreditReport, CreditReport } from "@/lib/types";

const ANALYSIS_STORAGE_KEY = "feeco.analysis.result";

type StoredAnalysis = {
  report: CreditReport | null;
  batchReport: BatchCreditReport | null;
  fileName: string;
  fileCount: number;
};

export type AnalysisState = {
  report: CreditReport | null;
  batchReport: BatchCreditReport | null;
  fileName: string;
  fileCount: number;
  error: string;
  isLoading: boolean;
  analyzeBatch: (files: File[]) => Promise<void>;
  reset: () => void;
};

export function useCreditReportAnalysis(): AnalysisState {
  const [report, setReport] = useState<CreditReport | null>(null);
  const [batchReport, setBatchReport] = useState<BatchCreditReport | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileCount, setFileCount] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedAnalysis = readStoredAnalysis();

    if (!storedAnalysis) {
      return;
    }

    setReport(storedAnalysis.report);
    setBatchReport(storedAnalysis.batchReport);
    setFileName(storedAnalysis.fileName);
    setFileCount(storedAnalysis.fileCount);
  }, []);

  async function analyzeBatch(files: File[]) {
    const nextFileName = batchFileLabel(files);

    setError("");
    setReport(null);
    setBatchReport(null);
    setFileName(nextFileName);
    setFileCount(files.length);
    setIsLoading(true);

    try {
      if (files.length === 1) {
        const analyzedReport = await analyzeCreditReport(files[0]);
        setReport(analyzedReport);
        writeStoredAnalysis({
          report: analyzedReport,
          batchReport: null,
          fileName: nextFileName,
          fileCount: files.length,
        });
      } else {
        const analyzedBatchReport = await analyzeCreditReportBatch(files);
        setBatchReport(analyzedBatchReport);
        writeStoredAnalysis({
          report: null,
          batchReport: analyzedBatchReport,
          fileName: nextFileName,
          fileCount: files.length,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut analiza aceste PDF-uri.");
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setReport(null);
    setBatchReport(null);
    setFileName("");
    setFileCount(0);
    setError("");
    setIsLoading(false);
    clearStoredAnalysis();
  }

  return { report, batchReport, fileName, fileCount, error, isLoading, analyzeBatch, reset };
}

function batchFileLabel(files: File[]): string {
  if (files.length === 0) {
    return "";
  }
  if (files.length === 1) {
    return files[0].name;
  }
  return `${files.length} PDFs`;
}

function readStoredAnalysis(): StoredAnalysis | null {
  try {
    const rawValue = window.localStorage.getItem(ANALYSIS_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as StoredAnalysis;
  } catch {
    clearStoredAnalysis();
    return null;
  }
}

function writeStoredAnalysis(analysis: StoredAnalysis) {
  try {
    window.localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analysis));
  } catch {
    // Storage is a convenience only; analysis should still succeed if unavailable.
  }
}

function clearStoredAnalysis() {
  try {
    window.localStorage.removeItem(ANALYSIS_STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}
