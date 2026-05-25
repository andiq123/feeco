import type { Account } from "@/lib/types";
import { formatRON } from "@/lib/formatters";
import { bankPolicyGuidance, guidanceToneClass } from "@/lib/credit-guidance";
import { copy, productLabel, statusLabel, type Language } from "@/lib/i18n";

type AccountsTableProps = {
  accounts: Account[];
  language: Language;
  limit?: number;
};

export function AccountsTable({ accounts, language, limit = 8 }: AccountsTableProps) {
  const visibleAccounts = accounts.slice(0, limit);
  const labels = copy[language].accounts;
  const guidance = bankPolicyGuidance(language);

  return (
    <div className="mac-panel-strong rounded-[1.35rem] p-3 sm:rounded-[2rem] sm:p-4">
      <div className="flex items-end justify-between gap-4">
        <h3 className="font-[var(--font-display)] text-xl font-semibold leading-tight sm:text-2xl">{labels.important}</h3>
        {accounts.length > visibleAccounts.length && <p className="text-sm text-[var(--muted)]">{labels.showingTop(visibleAccounts.length)}</p>}
      </div>
      <p className={`mt-2 rounded-2xl px-2.5 py-1.5 text-xs font-bold leading-4 sm:px-3 sm:py-2 sm:text-sm ${guidanceToneClass(guidance.tone)}`}>{guidance.text}</p>
      <div className="mt-2 grid gap-2 md:hidden">
        {visibleAccounts.length > 0 ? (
          visibleAccounts.map((account, index) => <AccountCard account={account} language={language} key={`${account.creditor}-${index}`} />)
        ) : (
          <p className="py-4 text-sm text-[var(--muted)]">{labels.empty}</p>
        )}
      </div>
      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <AccountTableHead language={language} />
          <tbody>
            {visibleAccounts.length > 0 ? (
              visibleAccounts.map((account, index) => <AccountRow account={account} language={language} key={`${account.creditor}-${index}`} />)
            ) : (
              <EmptyAccountsRow language={language} />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountCard({ account, language }: { account: Account; language: Language }) {
  const labels = copy[language].accounts;

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white/60 p-2.5 sm:p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{account.creditor}</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{productLabel(account.product, language)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            account.status === "Active" ? "bg-emerald-50 text-[var(--olive)]" : "bg-slate-100 text-[var(--muted)]"
          }`}
        >
          {statusLabel(account.status, language)}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-3 text-sm sm:mt-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{labels.balance}</p>
          <p className="numeric mt-1 font-bold">{formatRON(account.balanceRon)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{labels.pastDue}</p>
          <p className="numeric mt-1 font-bold text-[var(--clay)]">{formatRON(account.pastDueRon)}</p>
        </div>
      </div>
    </article>
  );
}

function AccountTableHead({ language }: Pick<AccountsTableProps, "language">) {
  const labels = copy[language].accounts;

  return (
    <thead>
      <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
        <th className="py-3 pr-4">{labels.creditor}</th>
        <th className="py-3 pr-4">{labels.product}</th>
        <th className="py-3 pr-4">{labels.status}</th>
        <th className="py-3 pr-4 text-right">{labels.balance}</th>
        <th className="py-3 text-right">{labels.pastDue}</th>
      </tr>
    </thead>
  );
}

function AccountRow({ account, language }: { account: Account; language: Language }) {
  return (
    <tr className="border-b border-[var(--line)] last:border-0">
      <td className="py-4 pr-4 font-bold">{account.creditor}</td>
      <td className="py-4 pr-4 text-[var(--muted)]">{productLabel(account.product, language)}</td>
      <td className="py-4 pr-4">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            account.status === "Active" ? "bg-emerald-50 text-[var(--olive)]" : "bg-slate-100 text-[var(--muted)]"
          }`}
        >
          {statusLabel(account.status, language)}
        </span>
      </td>
      <td className="numeric py-4 pr-4 text-right">{formatRON(account.balanceRon)}</td>
      <td className="numeric py-4 text-right text-[var(--clay)]">{formatRON(account.pastDueRon)}</td>
    </tr>
  );
}

function EmptyAccountsRow({ language }: Pick<AccountsTableProps, "language">) {
  return (
    <tr>
      <td className="py-6 text-[var(--muted)]" colSpan={5}>
        {copy[language].accounts.empty}
      </td>
    </tr>
  );
}
