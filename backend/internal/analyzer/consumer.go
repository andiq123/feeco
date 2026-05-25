package analyzer

import (
	"regexp"
	"strings"
)

var cnpPattern = regexp.MustCompile(`\b[1-9]\d{12}\b`)

func detectConsumer(lines []string) Consumer {
	consumer := Consumer{}
	for index, line := range lines {
		lowerLine := strings.ToLower(line)
		if consumer.CNP == "" {
			consumer.CNP = cnpPattern.FindString(line)
		}
		if consumer.Name == "" && hasNameLabel(lowerLine) {
			consumer.Name = labelValue(line)
			if consumer.Name == "" && index+1 < len(lines) {
				consumer.Name = lines[index+1]
			}
		}
	}
	return consumer
}

func hasNameLabel(line string) bool {
	return strings.Contains(line, "nume") || strings.Contains(line, "prenume")
}

func labelValue(line string) string {
	parts := strings.SplitN(line, ":", 2)
	if len(parts) != 2 {
		return ""
	}
	return strings.TrimSpace(parts[1])
}
