"use client";

import { CalendarRange } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { copy, type Language } from "@/lib/i18n";

type MobileTimelineControlsProps = {
  children: ReactNode;
  language: Language;
};

export function MobileTimelineControls({ children, language }: MobileTimelineControlsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <MobileTimelineLauncher language={language} onOpen={() => setOpen(true)} />
      <MobileTimelineSheet language={language} open={open} onClose={() => setOpen(false)}>
        {children}
      </MobileTimelineSheet>
    </>
  );
}

function MobileTimelineLauncher({ language, onOpen }: { language: Language; onOpen: () => void }) {
  const labels = copy[language].batch;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-7 lg:hidden">
      <div className="pointer-events-none fixed inset-x-0 bottom-[-24px] h-40 bg-gradient-to-t from-[#dfeaf7] from-0% via-[#dfeaf7] via-32% to-transparent" />
      <button
        className="relative mx-auto flex h-13 min-w-40 items-center justify-center gap-2 rounded-full border border-white/25 bg-[rgba(13,23,40,0.92)] px-5 text-[0.95rem] font-black text-white shadow-2xl shadow-slate-900/24 backdrop-blur-2xl transition-all duration-200 active:scale-95"
        type="button"
        onClick={onOpen}
      >
        <CalendarRange className="h-4 w-4" aria-hidden="true" />
        {labels.timelineOpen}
      </button>
    </div>
  );
}

function MobileTimelineSheet({ children, language, open, onClose }: { children: ReactNode; language: Language; open: boolean; onClose: () => void }) {
  const labels = copy[language].batch;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return (
    <div className={`fixed inset-0 z-40 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      <button className={`absolute inset-0 bg-slate-950/18 backdrop-blur-[2px] transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} type="button" aria-label={labels.close} onClick={onClose} />
      <section
        className={`absolute inset-x-0 bottom-0 max-h-[86dvh] rounded-t-[2rem] border border-white/70 bg-white/90 px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-2xl shadow-slate-900/20 backdrop-blur-2xl transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label={labels.timelineSheetTitle}
      >
        <button className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-slate-300/80" type="button" aria-label={labels.close} onClick={onClose} />
        <div className="mb-3 px-1">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--blue)]">{labels.timelineSheetTitle}</p>
          <p className="mt-1 text-xs font-bold leading-4 text-[var(--muted)]">{labels.timelineSheetHint}</p>
        </div>
        {children}
      </section>
    </div>
  );
}
