package analyzer

import (
	"regexp"
	"strings"
)

var (
	spacePattern = regexp.MustCompile(`[ \t]+`)
)

func normalizeText(text string) string {
	text = strings.ReplaceAll(text, "\r", "\n")
	text = spacePattern.ReplaceAllString(text, " ")

	lines := strings.Split(text, "\n")
	for index, line := range lines {
		lines[index] = strings.TrimSpace(line)
	}
	return strings.Join(lines, "\n")
}

func usefulLines(text string) []string {
	lines := make([]string, 0)
	for _, line := range strings.Split(text, "\n") {
		trimmedLine := strings.TrimSpace(line)
		if len(trimmedLine) >= 3 {
			lines = append(lines, trimmedLine)
		}
	}
	return lines
}
