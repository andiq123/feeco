package analyzer

import (
	"regexp"
	"strconv"
	"strings"
	"time"
)

var exactDatePattern = regexp.MustCompile(`^\d{2}[./-]\d{2}[./-]\d{4}$`)

type reportSignals struct {
	InquiryCount    int
	NegativeSignals int
	CreditScore     int
}

func detectReportSignals(text string, inquiries []Inquiry) reportSignals {
	lowerText := strings.ToLower(text)
	return reportSignals{
		InquiryCount:    activeInquiryCount(inquiries),
		NegativeSignals: countAny(lowerText, negativeSignalWords()),
		CreditScore:     detectCreditScore(text),
	}
}

func detectInquiries(text string, reportDate string) []Inquiry {
	reportTime := parseReportDate(reportDate)
	if reportTime.IsZero() {
		reportTime = time.Now()
	}

	candidates := inquiryCandidates(text)
	inquiries := make([]Inquiry, 0, len(candidates))
	seen := map[string]bool{}
	for _, candidate := range candidates {
		normalizedDate := normalizeDate(candidate.date)
		if seen[normalizedDate] {
			continue
		}
		seen[normalizedDate] = true

		inquiryTime := parseReportDate(normalizedDate)
		if inquiryTime.IsZero() {
			continue
		}
		resetTime := inquiryTime.AddDate(0, 6, 0)
		inquiries = append(inquiries, Inquiry{
			Date:      normalizedDate,
			ResetDate: resetTime.Format("2006-01-02"),
			Active:    !resetTime.Before(reportTime),
			Requester: candidate.requester,
			Source:    "Biroul de Credit - interogare",
		})
	}
	return inquiries
}

type inquiryCandidate struct {
	date      string
	requester string
}

func inquiryCandidates(text string) []inquiryCandidate {
	candidates := inquiryTableCandidates(text)
	if len(candidates) > 0 {
		return candidates
	}

	dates := fallbackInquiryDates(text)
	candidates = make([]inquiryCandidate, 0, len(dates))
	for _, date := range dates {
		candidates = append(candidates, inquiryCandidate{date: date})
	}
	return candidates
}

func inquiryTableCandidates(text string) []inquiryCandidate {
	lines := usefulLines(text)
	candidates := make([]inquiryCandidate, 0)
	inInquirySection := false

	for index, line := range lines {
		normalizedLine := strings.ToLower(line)
		if strings.Contains(normalizedLine, "participanţii cărora") || strings.Contains(normalizedLine, "participantii carora") {
			inInquirySection = true
			continue
		}
		if !inInquirySection {
			continue
		}
		if strings.Contains(normalizedLine, "legend") {
			break
		}
		if !exactDatePattern.MatchString(line) {
			continue
		}
		candidates = append(candidates, inquiryCandidate{
			date:      line,
			requester: nextInquiryRequester(lines[index+1:]),
		})
	}
	return candidates
}

func nextInquiryRequester(lines []string) string {
	for _, line := range lines {
		if exactDatePattern.MatchString(line) {
			return ""
		}
		if isInquiryTableNoise(line) {
			continue
		}
		return strings.TrimSpace(line)
	}
	return ""
}

func isInquiryTableNoise(line string) bool {
	normalizedLine := strings.ToLower(strings.TrimSpace(line))
	return normalizedLine == "" ||
		normalizedLine == "data" ||
		normalizedLine == "participantul" ||
		normalizedLine == "da" ||
		normalizedLine == "nu" ||
		strings.Contains(normalizedLine, "fico score") ||
		strings.Contains(normalizedLine, "biroul")
}

func fallbackInquiryDates(text string) []string {
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`(?is)data ultimei interogari.{0,420}?(\d{2}[./-]\d{2}[./-]\d{4})`),
		regexp.MustCompile(`(?is)ultima interogare.{0,420}?(\d{2}[./-]\d{2}[./-]\d{4})`),
		regexp.MustCompile(`(?is)cea mai recent[ăa] interogare.{0,420}?(\d{2}[./-]\d{2}[./-]\d{4})`),
		regexp.MustCompile(`(?is)interogare.{0,120}?(\d{2}[./-]\d{2}[./-]\d{4})`),
		regexp.MustCompile(`(?is)(\d{2}[./-]\d{2}[./-]\d{4}).{0,120}?interogare`),
	}

	dates := make([]string, 0)
	for _, pattern := range patterns {
		for _, match := range pattern.FindAllStringSubmatch(text, -1) {
			if len(match) > 1 {
				dates = append(dates, match[1])
			}
		}
	}
	return dates
}

func activeInquiryCount(inquiries []Inquiry) int {
	count := 0
	for _, inquiry := range inquiries {
		if inquiry.Active {
			count++
		}
	}
	return count
}

func detectCreditScore(text string) int {
	scorePattern := regexp.MustCompile(`(?is)scor:\s*(\d{3})`)
	matches := scorePattern.FindStringSubmatch(text)
	if len(matches) < 2 {
		return 0
	}
	score, err := strconv.Atoi(matches[1])
	if err != nil || score < 300 || score > 850 {
		return 0
	}
	return score
}

func negativeSignalWords() []string {
	return []string{
		"restant",
		"restanta",
		"intarziere",
		"intarzieri",
		"colectare",
		"executare",
		"insolventa",
		"frauda",
		"poprire",
		"litigiu",
		"write-off",
		"collection",
	}
}

func countAny(text string, words []string) int {
	count := 0
	for _, word := range words {
		count += strings.Count(text, word)
	}
	return count
}
