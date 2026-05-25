package analyzer

import (
	"bytes"
	"fmt"
	"io"
	"os"

	"github.com/ledongthuc/pdf"
)

func extractPDFText(fileName string, content []byte) (string, int, error) {
	tempFile, err := os.CreateTemp("", "credit-report-*.pdf")
	if err != nil {
		return "", 0, fmt.Errorf("temporary pdf: %w", err)
	}
	defer os.Remove(tempFile.Name())

	if _, err := tempFile.Write(content); err != nil {
		tempFile.Close()
		return "", 0, fmt.Errorf("write pdf: %w", err)
	}
	if err := tempFile.Close(); err != nil {
		return "", 0, fmt.Errorf("close pdf: %w", err)
	}

	file, reader, err := pdf.Open(tempFile.Name())
	if err != nil {
		return "", 0, fmt.Errorf("open pdf %q: %w", fileName, err)
	}
	defer file.Close()

	textReader, err := reader.GetPlainText()
	if err != nil {
		return "", reader.NumPage(), fmt.Errorf("extract pdf text: %w", err)
	}

	var text bytes.Buffer
	if _, err := io.Copy(&text, textReader); err != nil {
		return "", reader.NumPage(), fmt.Errorf("read pdf text: %w", err)
	}
	return text.String(), reader.NumPage(), nil
}
