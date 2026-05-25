package main

import (
	"fmt"
	"log/slog"
	"net/http"

	"credit-analyzer/backend/internal/analyzer"
)

func analyze(w http.ResponseWriter, r *http.Request) {
	uploadedFile, err := readUploadedPDF(w, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	report, err := analyzer.AnalyzePDF(uploadedFile.Name, uploadedFile.Content)
	if err != nil {
		slog.Warn("analysis error", "file", uploadedFile.Name, "error", err)
		http.Error(w, fmt.Sprintf("could not analyze PDF: %v", err), http.StatusUnprocessableEntity)
		return
	}

	writeJSON(w, http.StatusOK, report)
}

func analyzeBatch(w http.ResponseWriter, r *http.Request) {
	uploadedFiles, err := readUploadedPDFBatch(w, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	batchReport, err := analyzer.AnalyzePDFBatch(pdfInputs(uploadedFiles))
	if err != nil {
		slog.Warn("batch analysis error", "error", err)
		http.Error(w, fmt.Sprintf("could not analyze PDFs: %v", err), http.StatusUnprocessableEntity)
		return
	}

	writeJSON(w, http.StatusOK, batchReport)
}

func pdfInputs(files []uploadedPDF) []analyzer.PDFInput {
	inputs := make([]analyzer.PDFInput, 0, len(files))
	for _, file := range files {
		inputs = append(inputs, analyzer.PDFInput{Name: file.Name, Content: file.Content})
	}
	return inputs
}
