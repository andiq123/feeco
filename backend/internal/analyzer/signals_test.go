package analyzer

import "testing"

func TestDetectInquiriesUsesSixMonthReset(t *testing.T) {
	text := `
Participanţii cărora le-au fost eliberate Rapoarte de Credit vizând CNP/CUI: 1970907410055
Data
Participantul
Cu FICO Score de la Biroulde Credit
16-01-2026
REVOLUT BANK UAB
DA
Legendă:
`

	inquiries := detectInquiries(text, "2026-05-16")
	if len(inquiries) != 1 {
		t.Fatalf("expected 1 inquiry, got %d", len(inquiries))
	}

	inquiry := inquiries[0]
	if inquiry.Date != "2026-01-16" {
		t.Fatalf("expected inquiry date 2026-01-16, got %q", inquiry.Date)
	}
	if inquiry.ResetDate != "2026-07-16" {
		t.Fatalf("expected reset date 2026-07-16, got %q", inquiry.ResetDate)
	}
	if inquiry.Requester != "REVOLUT BANK UAB" {
		t.Fatalf("expected requester REVOLUT BANK UAB, got %q", inquiry.Requester)
	}
	if !inquiry.Active {
		t.Fatal("expected inquiry to be active before reset date")
	}
}

func TestDetectInquiriesMarksExpiredAfterSixMonths(t *testing.T) {
	text := `Data ultimei interogari 16-01-2026`

	inquiries := detectInquiries(text, "2026-08-01")
	if len(inquiries) != 1 {
		t.Fatalf("expected 1 inquiry, got %d", len(inquiries))
	}
	if inquiries[0].Active {
		t.Fatal("expected inquiry to be expired after reset date")
	}
}
