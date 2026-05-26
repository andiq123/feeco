package main

import (
	"errors"
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
		writeAnalysisError(w, err, "could not analyze PDF")
		return
	}

	recordParserRun(r)
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
		writeAnalysisError(w, err, "could not analyze PDFs")
		return
	}

	recordParserRun(r)
	writeJSON(w, http.StatusOK, batchReport)
}

func writeAnalysisError(w http.ResponseWriter, err error, fallback string) {
	if errors.Is(err, analyzer.ErrNotCreditBureauReport) {
		http.Error(w, err.Error(), http.StatusUnprocessableEntity)
		return
	}
	http.Error(w, fmt.Sprintf("%s: %v", fallback, err), http.StatusUnprocessableEntity)
}

func pdfInputs(files []uploadedPDF) []analyzer.PDFInput {
	inputs := make([]analyzer.PDFInput, 0, len(files))
	for _, file := range files {
		inputs = append(inputs, analyzer.PDFInput{Name: file.Name, Content: file.Content})
	}
	return inputs
}
