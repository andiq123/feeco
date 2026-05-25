package main

import (
	"fmt"
	"io"
	"net/http"
	"strings"
)

const (
	maxUploadBytes      = 15 << 20
	maxBatchFiles       = 50
	maxBatchUploadBytes = maxBatchFiles * maxUploadBytes
)

type uploadedPDF struct {
	Name    string
	Content []byte
}

func readUploadedPDF(w http.ResponseWriter, r *http.Request) (uploadedPDF, error) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)
	if err := r.ParseMultipartForm(maxUploadBytes); err != nil {
		return uploadedPDF{}, fmt.Errorf("upload a PDF up to 15 MB")
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		return uploadedPDF{}, fmt.Errorf("missing file field")
	}
	defer file.Close()

	content, err := readPDFContent(file, header.Filename, header.Header.Get("Content-Type"), header.Size)
	if err != nil {
		return uploadedPDF{}, err
	}

	return uploadedPDF{Name: header.Filename, Content: content}, nil
}

func readUploadedPDFBatch(w http.ResponseWriter, r *http.Request) ([]uploadedPDF, error) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBatchUploadBytes)
	if err := r.ParseMultipartForm(maxBatchUploadBytes); err != nil {
		return nil, fmt.Errorf("upload up to %d PDFs, each up to 15 MB", maxBatchFiles)
	}

	headers := r.MultipartForm.File["files"]
	if len(headers) == 0 {
		headers = r.MultipartForm.File["file"]
	}
	if len(headers) == 0 {
		return nil, fmt.Errorf("missing files field")
	}
	if len(headers) > maxBatchFiles {
		return nil, fmt.Errorf("upload at most %d PDFs at once", maxBatchFiles)
	}

	files := make([]uploadedPDF, 0, len(headers))
	for _, header := range headers {
		file, err := header.Open()
		if err != nil {
			return nil, fmt.Errorf("open %q: %w", header.Filename, err)
		}
		content, readErr := readPDFContent(file, header.Filename, header.Header.Get("Content-Type"), header.Size)
		closeErr := file.Close()
		if readErr != nil {
			return nil, readErr
		}
		if closeErr != nil {
			return nil, fmt.Errorf("close %q: %w", header.Filename, closeErr)
		}
		files = append(files, uploadedPDF{Name: header.Filename, Content: content})
	}
	return files, nil
}

func readPDFContent(file io.Reader, fileName string, contentType string, size int64) ([]byte, error) {
	if size > maxUploadBytes {
		return nil, fmt.Errorf("%q is larger than 15 MB", fileName)
	}
	if !isPDFUpload(fileName, contentType) {
		return nil, fmt.Errorf("%q is not a PDF", fileName)
	}

	content, err := io.ReadAll(io.LimitReader(file, maxUploadBytes+1))
	if err != nil {
		return nil, fmt.Errorf("could not read %q", fileName)
	}
	if len(content) > maxUploadBytes {
		return nil, fmt.Errorf("%q is larger than 15 MB", fileName)
	}
	return content, nil
}

func isPDFUpload(fileName string, contentType string) bool {
	return strings.EqualFold(contentType, "application/pdf") || strings.HasSuffix(strings.ToLower(fileName), ".pdf")
}
