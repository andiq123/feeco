package analyzer

import (
	"math"
)

func buildSummary(accounts []Account, signals reportSignals) Summary {
	summary := Summary{TotalAccounts: len(accounts)}
	for _, account := range accounts {
		addAccountToSummary(&summary, account)
	}
	summary.InquiryCount = signals.InquiryCount
	summary.NegativeSignals = signals.NegativeSignals
	summary.CreditScore = signals.CreditScore
	if summary.TotalLimitRON > 0 {
		summary.UtilizationPercent = math.Round((summary.TotalBalanceRON/summary.TotalLimitRON)*1000) / 10
	}
	summary.HealthScore = healthScore(summary)
	return summary
}

func addAccountToSummary(summary *Summary, account Account) {
	if account.Status == "Closed" {
		summary.ClosedAccounts++
	} else {
		summary.ActiveAccounts++
	}
	summary.TotalBalanceRON += account.BalanceRON
	summary.TotalLimitRON += account.LimitRON
	summary.TotalPastDueRON += account.PastDueRON
}

func healthScore(summary Summary) int {
	score := 100
	if summary.TotalPastDueRON > 0 {
		score -= 30
	}
	if summary.UtilizationPercent >= 90 {
		score -= 25
	} else if summary.UtilizationPercent >= 80 {
		score -= 18
	} else if summary.UtilizationPercent >= 50 {
		score -= 8
	}
	if summary.InquiryCount >= 6 {
		score -= 12
	} else if summary.InquiryCount >= 3 {
		score -= 6
	}
	if summary.NegativeSignals >= 5 {
		score -= 18
	} else if summary.NegativeSignals > 0 {
		score -= 10
	}
	if score < 0 {
		return 0
	}
	return score
}
