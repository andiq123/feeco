package analyzer

import (
	"errors"
	"sort"
)

func AnalyzePDF(fileName string, content []byte) (Report, error) {
	text, pages, err := extractPDFText(fileName, content)
	if err != nil {
		return Report{}, err
	}
	report, err := AnalyzeTextStrict(text, pages)
	if err != nil {
		return Report{}, err
	}
	report.FileName = fileName
	return report, nil
}

func AnalyzeText(text string, pages int) Report {
	normalizedText := normalizeText(text)
	lines := usefulLines(normalizedText)
	if err := validateCreditBureauReport(normalizedText, lines); err != nil {
		return Report{Summary: Summary{HealthScore: 0}}
	}
	return analyzeNormalizedText(normalizedText, lines)
}

func AnalyzeTextStrict(text string, pages int) (Report, error) {
	normalizedText := normalizeText(text)
	lines := usefulLines(normalizedText)
	if err := validateCreditBureauReport(normalizedText, lines); err != nil {
		return Report{}, err
	}
	return analyzeNormalizedText(normalizedText, lines), nil
}

func analyzeNormalizedText(normalizedText string, lines []string) Report {
	accounts := detectAccounts(lines)
	reportDate := detectReportDate(normalizedText)
	inquiries := detectInquiries(normalizedText, lines, reportDate)
	signals := detectReportSignals(normalizedText, inquiries)
	summary := buildSummary(accounts, signals)

	return Report{
		ReportDate: reportDate,
		Summary:    summary,
		Consumer:   detectConsumer(lines),
		Accounts:   accounts,
		Inquiries:  inquiries,
	}
}

func AnalyzePDFBatch(files []PDFInput) (BatchReport, error) {
	reports := make([]Report, 0, len(files))
	rejectedFiles := make([]string, 0)
	for _, file := range files {
		report, err := AnalyzePDF(file.Name, file.Content)
		if err != nil {
			if errors.Is(err, ErrNotCreditBureauReport) {
				rejectedFiles = append(rejectedFiles, file.Name)
				continue
			}
			return BatchReport{}, err
		}
		reports = append(reports, report)
	}
	if len(reports) == 0 && len(rejectedFiles) > 0 {
		return BatchReport{}, ErrNotCreditBureauReport
	}

	sortReportsByDate(reports)
	return buildBatchReport(reports, rejectedFiles), nil
}

func sortReportsByDate(reports []Report) {
	sort.SliceStable(reports, func(left, right int) bool {
		leftDate := parseReportDate(reports[left].ReportDate)
		rightDate := parseReportDate(reports[right].ReportDate)
		if leftDate.IsZero() || rightDate.IsZero() {
			return reports[left].FileName < reports[right].FileName
		}
		return leftDate.Before(rightDate)
	})
}

type PDFInput struct {
	Name    string
	Content []byte
}
