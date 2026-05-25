package analyzer

import (
	"regexp"
	"strings"
	"time"
)

var reportDatePatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)(\d{2}[./-]\d{2}[./-]\d{4})\s+\d{1,2}:\d{2}(?::\d{2})?`),
	regexp.MustCompile(`(?i)la data de:\s*(\d{2}[./-]\d{2}[./-]\d{4})`),
	regexp.MustCompile(`(?i)(?:data raportului|data raport|generat la|emis la|data emiterii|data solicitarii)\D{0,30}(\d{2}[./-]\d{2}[./-]\d{4})`),
}

func detectReportDate(text string) string {
	for _, pattern := range reportDatePatterns {
		matches := pattern.FindStringSubmatch(text)
		if len(matches) > 1 {
			return normalizeDate(matches[1])
		}
	}
	return ""
}

func normalizeDate(value string) string {
	value = strings.ReplaceAll(value, ".", "-")
	value = strings.ReplaceAll(value, "/", "-")
	parsed, err := time.Parse("02-01-2006", value)
	if err != nil {
		return value
	}
	return parsed.Format("2006-01-02")
}

func parseReportDate(value string) time.Time {
	parsed, err := time.Parse("2006-01-02", value)
	if err == nil {
		return parsed
	}
	parsed, _ = time.Parse("02-01-2006", value)
	return parsed
}
