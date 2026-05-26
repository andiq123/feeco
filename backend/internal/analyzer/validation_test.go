package analyzer

import (
	"errors"
	"os"
	"testing"
)

func TestValidateCreditBureauReportRejectsGenericPDFText(t *testing.T) {
	text := `
PDF Test File
Congratulations, your computer is equipped with a PDF reader.
Yukon Department of Education
`

	err := validateCreditBureauReport(normalizeText(text), usefulLines(text))
	if !errors.Is(err, ErrNotCreditBureauReport) {
		t.Fatalf("validateCreditBureauReport() error = %v, want %v", err, ErrNotCreditBureauReport)
	}
}

func TestAnalyzePDFRejectsExternalGenericPDF(t *testing.T) {
	path := os.Getenv("PDF_TEST_PATH")
	if path == "" {
		t.Skip("PDF_TEST_PATH is not set")
	}

	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read PDF_TEST_PATH: %v", err)
	}

	_, err = AnalyzePDF("external-test.pdf", content)
	if !errors.Is(err, ErrNotCreditBureauReport) {
		t.Fatalf("AnalyzePDF() error = %v, want %v", err, ErrNotCreditBureauReport)
	}
}

func TestValidateCreditBureauReportAcceptsBiroulDeCreditReportText(t *testing.T) {
	text := `
Biroul de Credit
Raport de Credit
Cu FICO Score de la Biroulde Credit
CNP/CUI: 1970907410055
Generat la 26-05-2026
`

	if err := validateCreditBureauReport(normalizeText(text), usefulLines(text)); err != nil {
		t.Fatalf("validateCreditBureauReport() error = %v, want nil", err)
	}
}

func TestAnalyzePDFBatchSkipsNonReportTextInputs(t *testing.T) {
	validReport, err := AnalyzeTextStrict(`
Biroul de Credit
Raport de Credit
Cu FICO Score de la Biroulde Credit
CNP/CUI: 1970907410055
Generat la 26-05-2026
`, 1)
	if err != nil {
		t.Fatalf("AnalyzeTextStrict() error = %v, want nil", err)
	}
	validReport.FileName = "valid.pdf"

	batch := buildBatchReport([]Report{validReport}, []string{"not-report.pdf"})

	if len(batch.Reports) != 1 {
		t.Fatalf("reports = %d, want 1", len(batch.Reports))
	}
	if len(batch.RejectedFiles) != 1 || batch.RejectedFiles[0] != "not-report.pdf" {
		t.Fatalf("rejected files = %#v, want not-report.pdf", batch.RejectedFiles)
	}
}
