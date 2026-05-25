export type CreditReport = {
  fileName: string;
  reportDate: string;
  summary: {
    totalAccounts: number;
    activeAccounts: number;
    closedAccounts: number;
    totalBalanceRon: number;
    totalPastDueRon: number;
    totalLimitRon: number;
    utilizationPercent: number;
    inquiryCount: number;
    negativeSignals: number;
    healthScore: number;
    creditScore: number;
  };
  consumer: {
    name: string;
    cnp: string;
  };
  accounts: Account[];
  inquiries: Inquiry[];
};

export type BatchCreditReport = {
  reports: CreditReport[];
  timeline: TimelinePoint[];
  summary: BatchSummary;
};

export type BatchSummary = {
  reportCount: number;
  firstReportDate: string;
  lastReportDate: string;
  balanceChangeRon: number;
  pastDueChangeRon: number;
  utilizationChange: number;
  healthScoreChange: number;
  latestHealthScore: number;
  creditScoreChange: number;
  latestCreditScore: number;
  latestTotalBalanceRon: number;
  latestPastDueRon: number;
};

export type TimelinePoint = {
  fileName: string;
  reportDate: string;
  label: string;
  healthScore: number;
  creditScore: number;
  totalBalanceRon: number;
  totalPastDueRon: number;
  utilizationPercent: number;
  activeAccounts: number;
  inquiryCount: number;
  negativeSignals: number;
};

export type Account = {
  creditor: string;
  product: string;
  status: string;
  openedDate: string;
  closedDate: string;
  currency: string;
  limitRon: number;
  balanceRon: number;
  pastDueRon: number;
  monthlyRon: number;
  rawConfidence: string;
};

export type Inquiry = {
  date: string;
  resetDate: string;
  active: boolean;
  requester: string;
  source: string;
};
