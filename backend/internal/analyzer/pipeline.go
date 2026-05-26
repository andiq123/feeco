package analyzer

import "sort"

func AnalyzePDF(fileName string, content []byte) (Report, error) {
	text, pages, err := extractPDFText(fileName, content)
	if err != nil {
		return Report{}, err
	}
	report := AnalyzeText(text, pages)
	report.FileName = fileName
	return report, nil
}

func AnalyzeText(text string, pages int) Report {
	normalizedText := normalizeText(text)
	lines := usefulLines(normalizedText)
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
	for _, file := range files {
		report, err := AnalyzePDF(file.Name, file.Content)
		if err != nil {
			return BatchReport{}, err
		}
		reports = append(reports, report)
	}

	sortReportsByDate(reports)
	return buildBatchReport(reports), nil
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
