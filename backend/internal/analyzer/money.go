package analyzer

import (
	"math"
	"regexp"
	"strconv"
	"strings"
)

var moneyPattern = regexp.MustCompile(`(?i)(?:RON|LEI)?\s*[-+]?\d{1,3}(?:[ .]\d{3})*(?:,\d{2})?|\b\d+(?:,\d{2})?\s*(?:RON|LEI)\b`)

func amountsFromText(text string) []float64 {
	matches := moneyPattern.FindAllString(text, -1)
	amounts := make([]float64, 0, len(matches))
	for _, match := range matches {
		amount, ok := parseRON(match)
		if ok && amount > 0 {
			amounts = append(amounts, amount)
		}
	}
	return amounts
}

func parseRON(value string) (float64, bool) {
	cleanValue := strings.ToUpper(value)
	cleanValue = strings.ReplaceAll(cleanValue, "RON", "")
	cleanValue = strings.ReplaceAll(cleanValue, "LEI", "")
	cleanValue = strings.ReplaceAll(cleanValue, " ", "")
	cleanValue = strings.ReplaceAll(cleanValue, ".", "")
	if looksLikeThousandsComma(cleanValue) {
		cleanValue = strings.ReplaceAll(cleanValue, ",", "")
	} else {
		cleanValue = strings.ReplaceAll(cleanValue, ",", ".")
	}

	amount, err := strconv.ParseFloat(strings.TrimSpace(cleanValue), 64)
	if err != nil || math.IsNaN(amount) {
		return 0, false
	}
	return amount, true
}

func looksLikeThousandsComma(value string) bool {
	parts := strings.Split(value, ",")
	if len(parts) < 2 {
		return false
	}
	for index := 1; index < len(parts); index++ {
		if len(parts[index]) != 3 {
			return false
		}
	}
	return true
}

func formatRON(value float64) string {
	return strconv.FormatFloat(value, 'f', 0, 64) + " RON"
}

func smallestPositive(values []float64) float64 {
	smallest := 0.0
	for _, value := range values {
		if value <= 0 {
			continue
		}
		if smallest == 0 || value < smallest {
			smallest = value
		}
	}
	return smallest
}
