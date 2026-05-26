package analyzer

import (
	"errors"
	"strings"
)

var ErrNotCreditBureauReport = errors.New("PDF-ul încărcat nu pare să fie un raport de la Biroul de Credit")

func validateCreditBureauReport(text string, lines []string) error {
	lowerText := strings.ToLower(text)
	hasBureauMarker := strings.Contains(lowerText, "biroul de credit") || strings.Contains(lowerText, "biroulde credit")
	supportingSignals := 0

	if strings.Contains(lowerText, "raport de credit") || strings.Contains(lowerText, "rapoarte de credit") {
		supportingSignals++
	}
	if strings.Contains(lowerText, "fico") || strings.Contains(lowerText, "scor") {
		supportingSignals++
	}
	if strings.Contains(lowerText, "cnp/cui") || cnpPattern.MatchString(text) {
		supportingSignals++
	}
	if detectReportDate(text) != "" {
		supportingSignals++
	}

	if hasBureauMarker && supportingSignals > 0 {
		return nil
	}

	for _, line := range lines {
		normalizedLine := strings.ToLower(line)
		if strings.Contains(normalizedLine, "biroul") && strings.Contains(normalizedLine, "credit") && supportingSignals > 0 {
			return nil
		}
	}

	return ErrNotCreditBureauReport
}
