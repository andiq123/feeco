"use client";

import { useEffect, useState } from "react";
import { analyzeCreditReport, analyzeCreditReportBatch } from "@/lib/analyze-report";
import { checkBackendHealth } from "@/lib/backend-health";
import type { BatchCreditReport, CreditReport } from "@/lib/types";

const ANALYSIS_STORAGE_KEY = "feeco.analysis.result";
const HEALTH_CHECK_INTERVAL_MS = 30_000;

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
  parsingFiles: string[];
  error: string;
  isBackendAvailable: boolean;
  isLoading: boolean;
  analyzeBatch: (files: File[]) => Promise<void>;
  reset: () => void;
};

export function useCreditReportAnalysis(): AnalysisState {
  const [report, setReport] = useState<CreditReport | null>(null);
  const [batchReport, setBatchReport] = useState<BatchCreditReport | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileCount, setFileCount] = useState(0);
  const [parsingFiles, setParsingFiles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
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

  useEffect(() => {
    let active = true;

    async function refreshHealth() {
      const healthy = await checkBackendHealth();
      if (active) {
        setIsBackendAvailable(healthy);
      }
    }

    void refreshHealth();
    const interval = window.setInterval(refreshHealth, HEALTH_CHECK_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  async function analyzeBatch(files: File[]) {
    const healthy = await checkBackendHealth();
    setIsBackendAvailable(healthy);
    if (!healthy) {
      setError("API-ul nu este disponibil momentan.");
      return;
    }

    const nextFileName = batchFileLabel(files);

    setError("");
    setReport(null);
    setBatchReport(null);
    setFileName(nextFileName);
    setFileCount(files.length);
    setParsingFiles(files.map((file) => file.name));
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
      setParsingFiles([]);
      setIsLoading(false);
    }
  }

  function reset() {
    setReport(null);
    setBatchReport(null);
    setFileName("");
    setFileCount(0);
    setParsingFiles([]);
    setError("");
    setIsLoading(false);
    clearStoredAnalysis();
  }

  return { report, batchReport, fileName, fileCount, parsingFiles, error, isBackendAvailable, isLoading, analyzeBatch, reset };
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
