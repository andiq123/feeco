package analyzer

type Report struct {
	FileName   string    `json:"fileName"`
	ReportDate string    `json:"reportDate"`
	Summary    Summary   `json:"summary"`
	Consumer   Consumer  `json:"consumer"`
	Accounts   []Account `json:"accounts"`
	Inquiries  []Inquiry `json:"inquiries"`
}

type BatchReport struct {
	Reports       []Report        `json:"reports"`
	Timeline      []TimelinePoint `json:"timeline"`
	Summary       BatchSummary    `json:"summary"`
	RejectedFiles []string        `json:"rejectedFiles"`
}

type BatchSummary struct {
	ReportCount           int     `json:"reportCount"`
	FirstReportDate       string  `json:"firstReportDate"`
	LastReportDate        string  `json:"lastReportDate"`
	BalanceChangeRON      float64 `json:"balanceChangeRon"`
	PastDueChangeRON      float64 `json:"pastDueChangeRon"`
	UtilizationChange     float64 `json:"utilizationChange"`
	HealthScoreChange     int     `json:"healthScoreChange"`
	LatestHealthScore     int     `json:"latestHealthScore"`
	CreditScoreChange     int     `json:"creditScoreChange"`
	LatestCreditScore     int     `json:"latestCreditScore"`
	LatestTotalBalanceRON float64 `json:"latestTotalBalanceRon"`
	LatestPastDueRON      float64 `json:"latestPastDueRon"`
}

type TimelinePoint struct {
	FileName           string  `json:"fileName"`
	ReportDate         string  `json:"reportDate"`
	Label              string  `json:"label"`
	HealthScore        int     `json:"healthScore"`
	CreditScore        int     `json:"creditScore"`
	TotalBalanceRON    float64 `json:"totalBalanceRon"`
	TotalPastDueRON    float64 `json:"totalPastDueRon"`
	UtilizationPercent float64 `json:"utilizationPercent"`
	ActiveAccounts     int     `json:"activeAccounts"`
	InquiryCount       int     `json:"inquiryCount"`
	NegativeSignals    int     `json:"negativeSignals"`
}

type Summary struct {
	TotalAccounts      int     `json:"totalAccounts"`
	ActiveAccounts     int     `json:"activeAccounts"`
	ClosedAccounts     int     `json:"closedAccounts"`
	TotalBalanceRON    float64 `json:"totalBalanceRon"`
	TotalPastDueRON    float64 `json:"totalPastDueRon"`
	TotalLimitRON      float64 `json:"totalLimitRon"`
	UtilizationPercent float64 `json:"utilizationPercent"`
	InquiryCount       int     `json:"inquiryCount"`
	NegativeSignals    int     `json:"negativeSignals"`
	HealthScore        int     `json:"healthScore"`
	CreditScore        int     `json:"creditScore"`
}

type Consumer struct {
	Name string `json:"name"`
	CNP  string `json:"cnp"`
}

type Account struct {
	Creditor      string  `json:"creditor"`
	Product       string  `json:"product"`
	Status        string  `json:"status"`
	OpenedDate    string  `json:"openedDate"`
	ClosedDate    string  `json:"closedDate"`
	Currency      string  `json:"currency"`
	LimitRON      float64 `json:"limitRon"`
	BalanceRON    float64 `json:"balanceRon"`
	PastDueRON    float64 `json:"pastDueRon"`
	MonthlyRON    float64 `json:"monthlyRon"`
	RawConfidence string  `json:"rawConfidence"`
}

type Inquiry struct {
	Date      string `json:"date"`
	ResetDate string `json:"resetDate"`
	Active    bool   `json:"active"`
	Requester string `json:"requester"`
	Source    string `json:"source"`
}
