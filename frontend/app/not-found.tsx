import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-3 py-6 text-[var(--ink)] sm:px-6">
      <section className="mac-panel w-full max-w-xl rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-8">
        <BrandLogo />
        <div className="mt-10 grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
          <div className="grid h-16 w-16 place-items-center rounded-[1.35rem] bg-[#edf4ff] text-[var(--blue)] shadow-sm">
            <FileQuestion className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--olive)]">404</p>
            <h1 className="pretty-heading mt-2 font-[var(--font-display)] text-4xl font-semibold leading-none sm:text-5xl">Page not found</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted)] sm:text-base">
              This page is not part of Feeco. Return to the upload screen to analyze a credit report.
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-5">
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--ink)] px-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
            href="/"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Feeco
          </Link>
        </div>
      </section>
    </main>
  );
}
