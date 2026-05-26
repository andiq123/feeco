package analyzer

import "fmt"

func buildBatchReport(reports []Report, rejectedFiles []string) BatchReport {
	timeline := buildTimeline(reports)
	return BatchReport{
		Reports:       reports,
		Timeline:      timeline,
		Summary:       buildBatchSummary(timeline),
		RejectedFiles: rejectedFiles,
	}
}

func buildTimeline(reports []Report) []TimelinePoint {
	points := make([]TimelinePoint, 0, len(reports))
	for index, report := range reports {
		points = append(points, TimelinePoint{
			FileName:           report.FileName,
			ReportDate:         report.ReportDate,
			Label:              reportLabel(report, index),
			HealthScore:        report.Summary.HealthScore,
			CreditScore:        report.Summary.CreditScore,
			TotalBalanceRON:    report.Summary.TotalBalanceRON,
			TotalPastDueRON:    report.Summary.TotalPastDueRON,
			UtilizationPercent: report.Summary.UtilizationPercent,
			ActiveAccounts:     report.Summary.ActiveAccounts,
			InquiryCount:       report.Summary.InquiryCount,
			NegativeSignals:    report.Summary.NegativeSignals,
		})
	}
	return points
}

func reportLabel(report Report, index int) string {
	if report.ReportDate != "" {
		return report.ReportDate
	}
	return fmt.Sprintf("Report %d", index+1)
}

func buildBatchSummary(timeline []TimelinePoint) BatchSummary {
	if len(timeline) == 0 {
		return BatchSummary{}
	}

	first := timeline[0]
	latest := timeline[len(timeline)-1]
	return BatchSummary{
		ReportCount:           len(timeline),
		FirstReportDate:       first.ReportDate,
		LastReportDate:        latest.ReportDate,
		BalanceChangeRON:      latest.TotalBalanceRON - first.TotalBalanceRON,
		PastDueChangeRON:      latest.TotalPastDueRON - first.TotalPastDueRON,
		UtilizationChange:     latest.UtilizationPercent - first.UtilizationPercent,
		HealthScoreChange:     latest.HealthScore - first.HealthScore,
		LatestHealthScore:     latest.HealthScore,
		CreditScoreChange:     latest.DisplayScore() - first.DisplayScore(),
		LatestCreditScore:     latest.DisplayScore(),
		LatestTotalBalanceRON: latest.TotalBalanceRON,
		LatestPastDueRON:      latest.TotalPastDueRON,
	}
}

func (point TimelinePoint) DisplayScore() int {
	if point.CreditScore > 0 {
		return point.CreditScore
	}
	return point.HealthScore
}
