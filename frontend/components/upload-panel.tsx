"use client";

import { BarChart3, Coffee, ExternalLink, FileStack, FileText, Loader2, LockKeyhole, ScanSearch, Upload } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { copy, type Language } from "@/lib/i18n";
import { DragEvent, useState } from "react";

const maxPDFCount = 50;

type UploadPanelProps = {
  fileName: string;
  fileCount: number;
  error: string;
  isLoading: boolean;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onAnalyze: (files: File[]) => Promise<void>;
};

export function UploadPanel({ fileName, fileCount, error, isLoading, language, onLanguageChange, onAnalyze }: UploadPanelProps) {
  return (
    <aside className="rise-in mac-panel rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-7">
      <Header language={language} onLanguageChange={onLanguageChange} />
      <div className="mt-5 grid gap-4 sm:mt-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
        <div>
          <UploadDropzone isLoading={isLoading} language={language} onAnalyze={onAnalyze} />
          <SelectedFile fileName={fileName} fileCount={fileCount} isLoading={isLoading} language={language} />
          <UploadError error={error} />
        </div>
        <UploadInfoWidgets language={language} />
      </div>
    </aside>
  );
}

function Header({ language, onLanguageChange }: Pick<UploadPanelProps, "language" | "onLanguageChange">) {
  const labels = copy[language].upload;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <BrandLogo />
        <p className="mt-5 text-[0.68rem] font-bold uppercase leading-4 tracking-[0.16em] text-[var(--olive)] sm:text-xs sm:tracking-[0.18em]">{labels.brand}</p>
        <h1 className="pretty-heading mt-2 max-w-2xl font-[var(--font-display)] text-[2.6rem] font-semibold leading-[0.92] sm:mt-3 sm:text-5xl">{labels.title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
        <LanguageSwitcher language={language} onChange={onLanguageChange} />
        <CoffeeLink />
      </div>
    </div>
  );
}

function CoffeeLink() {
  const paypalURL = process.env.NEXT_PUBLIC_PAYPAL_COFFEE_URL;

  if (!paypalURL) {
    return null;
  }

  return (
    <a
      className="inline-flex h-10 items-center gap-2 rounded-full border border-[rgba(50,120,255,0.18)] bg-white/70 px-3 text-xs font-black text-[var(--ink)] shadow-sm transition hover:-translate-y-0.5 hover:border-[rgba(50,120,255,0.34)] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
      href={paypalURL}
      target="_blank"
      rel="noreferrer"
    >
      <Coffee className="h-4 w-4 text-[var(--olive)]" aria-hidden="true" />
      <span>Buy me a coffee</span>
      <ExternalLink className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
    </a>
  );
}

function UploadDropzone({ isLoading, language, onAnalyze }: Pick<UploadPanelProps, "isLoading" | "language" | "onAnalyze">) {
  const [isDragging, setIsDragging] = useState(false);
  const labels = copy[language].upload;

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const files = pdfFilesFromList(event.dataTransfer.files);
    if (files.length > 0) {
      void onAnalyze(files);
    }
  }

  return (
    <label
      className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed p-5 text-center transition-all duration-200 focus-within:ring-2 focus-within:ring-[var(--blue)] sm:min-h-80 sm:rounded-[1.75rem] sm:p-8 ${
        isDragging ? "scale-[1.01] border-[var(--blue)] bg-[#eaf3ff]" : "border-[rgba(50,120,255,0.32)] bg-white/55 hover:-translate-y-0.5 hover:bg-white/80"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }
        setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      <input
        className="sr-only"
        type="file"
        multiple
        accept="application/pdf,.pdf"
        onChange={(event) => {
          const files = pdfFilesFromList(event.target.files);
          if (files.length > 0) void onAnalyze(files);
          event.currentTarget.value = "";
        }}
      />
      <div className="grid h-14 w-14 place-items-center rounded-[1.35rem] bg-[#edf4ff] text-[var(--blue)] sm:h-16 sm:w-16 sm:rounded-3xl">
        {isLoading ? <Loader2 className="h-7 w-7 animate-spin sm:h-8 sm:w-8" /> : <Upload className="h-7 w-7 sm:h-8 sm:w-8" />}
      </div>
      <span className="mt-4 max-w-md text-lg font-bold leading-tight sm:mt-5 sm:text-xl">{isDragging ? labels.drop : labels.choose}</span>
      <span className="mt-2 max-w-sm text-sm leading-5 text-[var(--muted)] sm:mt-3 sm:leading-6">{labels.subtitle}</span>
    </label>
  );
}

function pdfFilesFromList(fileList: FileList | null): File[] {
  return Array.from(fileList ?? [])
    .filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
    .slice(0, maxPDFCount);
}

function SelectedFile({ fileName, fileCount, isLoading, language }: Pick<UploadPanelProps, "fileName" | "fileCount" | "isLoading" | "language">) {
  if (!fileName) {
    return null;
  }
  const labels = copy[language].upload;

  return (
    <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white/70 p-3 sm:mt-4">
      <FileText className="mt-0.5 h-5 w-5 text-[var(--blue)]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{fileName}</p>
        <p className="text-xs text-[var(--muted)]">{isLoading ? labels.analyzing : labels.ready(fileCount)}</p>
      </div>
    </div>
  );
}

function UploadError({ error }: Pick<UploadPanelProps, "error">) {
  if (!error) {
    return null;
  }

  return <div className="mt-4 rounded-2xl border border-[rgba(224,93,93,0.32)] bg-[#fff1f1] p-3 text-sm text-[var(--clay)]">{error}</div>;
}

function UploadInfoWidgets({ language }: Pick<UploadPanelProps, "language">) {
  const labels = copy[language].upload;
  const items = [
    { title: labels.secureTitle, body: labels.secureBody, icon: <LockKeyhole /> },
    { title: labels.batchTitle, body: labels.batchBody, icon: <FileStack /> },
    { title: labels.timelineTitle, body: labels.timelineBody, icon: <BarChart3 /> },
    { title: labels.focusTitle, body: labels.focusBody, icon: <ScanSearch /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
      {items.map((item) => (
        <div className="mac-panel-strong flex min-h-[8.6rem] flex-col gap-3 rounded-3xl p-4 sm:min-h-24 sm:flex-row sm:items-start" key={item.title}>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-[var(--olive)] [&_svg]:h-5 [&_svg]:w-5">{item.icon}</div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-5">{item.title}</p>
            <p className="mt-1 text-[0.8rem] leading-5 text-[var(--muted)] sm:text-sm">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
