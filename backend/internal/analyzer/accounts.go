package analyzer

import (
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

var (
	datePattern         = regexp.MustCompile(`\b\d{2}[./-]\d{2}[./-]\d{4}\b`)
	creditorPattern     = regexp.MustCompile(`(?i)\b(BANCA|BANK|IFN|LEASING|FINANCE|SA|S\.A\.|SRL|S\.R\.L\.|BRD|BCR|BT|CEC|ING|RAIFFEISEN|UNICREDIT|ALPHA|GARANTI|OTP|PATRIA|REVOLUT)\b`)
	accountNoisePattern = regexp.MustCompile(`(?i)(biroul de credit|rapoarte de credit|fico|scor|cnp/cui|explicaţii|nota:)`)
)

func detectAccounts(lines []string) []Account {
	detailedAccounts := detectDetailedAccounts(lines)
	if len(detailedAccounts) > 0 {
		sortAccountsByBalance(detailedAccounts)
		return detailedAccounts
	}

	seenAccounts := map[string]bool{}
	accounts := make([]Account, 0)

	for index, line := range lines {
		if !looksLikeAccountLine(line) {
			continue
		}

		window := accountWindow(lines, index)
		account := accountFromText(window)
		if !isUsefulAccount(account) {
			continue
		}
		key := accountKey(account)
		if seenAccounts[key] {
			continue
		}

		seenAccounts[key] = true
		accounts = append(accounts, account)
	}

	sortAccountsByBalance(accounts)
	return accounts
}

func detectDetailedAccounts(lines []string) []Account {
	accounts := make([]Account, 0)
	for index := 0; index < len(lines); index++ {
		if !strings.HasPrefix(lines[index], "Participant:") {
			continue
		}

		block := accountDetailBlock(lines, index)
		account, ok := accountFromDetailBlock(block)
		if ok {
			accounts = append(accounts, account)
		}
	}
	return dedupeAccounts(accounts)
}

func accountDetailBlock(lines []string, start int) []string {
	end := start + 1
	for end < len(lines) {
		if end > start && strings.HasPrefix(lines[end], "Participant:") {
			break
		}
		if strings.Contains(lines[end], "Participanţii cărora") {
			break
		}
		end++
	}
	return lines[start:end]
}

func accountFromDetailBlock(block []string) (Account, bool) {
	sourceText := strings.Join(block, " ")
	creditor := knownCreditorName(sourceText)
	if creditor == "" {
		return Account{}, false
	}

	productIndex := findProductLine(block)
	statusIndex := findStatusLine(block)
	if productIndex == -1 || statusIndex == -1 {
		return Account{}, false
	}

	amounts := detailAmounts(block[statusIndex+1:])
	account := Account{
		Creditor:      creditor,
		Product:       detectProduct(block[productIndex]),
		Status:        detectDetailedStatus(block[statusIndex]),
		Currency:      "RON",
		RawConfidence: "parsed from detailed account block",
	}
	fillDetailedAmounts(&account, amounts)
	fillDetailedDates(&account, block)
	return account, true
}

func findProductLine(lines []string) int {
	for index, line := range lines {
		if isProductLine(line) {
			return index
		}
	}
	return -1
}

func findStatusLine(lines []string) int {
	for index, line := range lines {
		if strings.HasPrefix(strings.ToLower(line), "cont ") {
			return index
		}
	}
	return -1
}

func isProductLine(line string) bool {
	lowerLine := strings.ToLower(line)
	return strings.Contains(lowerLine, "credit de ") ||
		strings.Contains(lowerLine, "card de credit") ||
		strings.Contains(lowerLine, "revolving")
}

func detectDetailedStatus(line string) string {
	lowerLine := strings.ToLower(line)
	switch {
	case strings.Contains(lowerLine, "fara restante"):
		return "Active"
	case strings.Contains(lowerLine, "inchis") || strings.Contains(lowerLine, "sold zero") || strings.Contains(lowerLine, "platit complet"):
		return "Closed"
	default:
		return detectStatus(line)
	}
}

func detailAmounts(lines []string) []float64 {
	amounts := make([]float64, 0)
	for _, line := range lines {
		if strings.Contains(line, "DataActualizării") {
			break
		}
		if !isStandaloneAmount(line) {
			continue
		}
		amount, ok := parseRON(line)
		if ok {
			amounts = append(amounts, amount)
		}
	}
	return amounts
}

func isStandaloneAmount(line string) bool {
	line = strings.TrimSpace(line)
	if line == "" || datePattern.MatchString(line) || strings.Contains(strings.ToLower(line), "luni") {
		return false
	}
	if _, err := strconv.Atoi(strings.ReplaceAll(line, ",", "")); err != nil {
		return false
	}
	return true
}

func fillDetailedAmounts(account *Account, amounts []float64) {
	if account.Status == "Closed" {
		account.BalanceRON = 0
		account.PastDueRON = 0
		if len(amounts) > 0 {
			account.LimitRON = amounts[len(amounts)-1]
		}
		return
	}

	switch len(amounts) {
	case 0:
		return
	case 1:
		account.LimitRON = amounts[0]
	default:
		account.BalanceRON = amounts[0]
		account.LimitRON = amounts[1]
	}
}

func fillDetailedDates(account *Account, lines []string) {
	dates := datePattern.FindAllString(strings.Join(lines, " "), -1)
	if len(dates) > 1 {
		account.OpenedDate = dates[1]
	}
}

func dedupeAccounts(accounts []Account) []Account {
	seenAccounts := map[string]bool{}
	deduped := make([]Account, 0, len(accounts))
	for _, account := range accounts {
		key := accountKey(account)
		if seenAccounts[key] {
			continue
		}
		seenAccounts[key] = true
		deduped = append(deduped, account)
	}
	return deduped
}

func accountWindow(lines []string, index int) string {
	start := max(0, index-2)
	end := min(len(lines), index+6)
	return strings.Join(lines[start:end], " ")
}

func looksLikeAccountLine(line string) bool {
	lowerLine := strings.ToLower(line)
	hasCreditTerm := strings.Contains(lowerLine, "credit") ||
		strings.Contains(lowerLine, "card") ||
		strings.Contains(lowerLine, "leasing") ||
		strings.Contains(lowerLine, "overdraft")
	hasMoney := moneyPattern.MatchString(line)

	return !accountNoisePattern.MatchString(line) && (creditorPattern.MatchString(line) || (hasCreditTerm && hasMoney))
}

func accountFromText(text string) Account {
	amounts := amountsFromText(text)
	dates := datePattern.FindAllString(text, -1)

	account := Account{
		Creditor:      detectedCreditor(text),
		Product:       detectProduct(text),
		Status:        detectStatus(text),
		Currency:      "RON",
		RawConfidence: "estimated from PDF text",
	}
	fillAccountDates(&account, dates)
	fillAccountAmounts(&account, amounts)
	fillPastDueAmount(&account, text, amounts)

	return account
}

func detectedCreditor(text string) string {
	if creditor := knownCreditorName(text); creditor != "" {
		return creditor
	}
	words := strings.Fields(text)
	for index, word := range words {
		if creditorPattern.MatchString(word) {
			start := max(0, index-2)
			end := min(len(words), index+4)
			return strings.Trim(strings.Join(words[start:end], " "), " ,.;:")
		}
	}
	return "Detected lender"
}

func knownCreditorName(text string) string {
	upperText := strings.ToUpper(text)
	switch {
	case strings.Contains(upperText, "BANCA TRANSILVANIA") || strings.Contains(upperText, "BTRL"):
		return "Banca Transilvania"
	case strings.Contains(upperText, "REVOLUT"):
		return "Revolut Bank"
	case strings.Contains(upperText, "ING"):
		return "ING Bank"
	case strings.Contains(upperText, "BRD"):
		return "BRD"
	case strings.Contains(upperText, "BCR"):
		return "BCR"
	case strings.Contains(upperText, "CEC"):
		return "CEC Bank"
	case strings.Contains(upperText, "RAIFFEISEN"):
		return "Raiffeisen Bank"
	case strings.Contains(upperText, "UNICREDIT"):
		return "UniCredit"
	default:
		return ""
	}
}

func isUsefulAccount(account Account) bool {
	if accountNoisePattern.MatchString(account.Creditor) {
		return false
	}
	if account.Creditor == "Detected lender" {
		return false
	}
	if account.BalanceRON == 0 && account.LimitRON == 0 && account.PastDueRON == 0 {
		return false
	}
	return creditorPattern.MatchString(account.Creditor)
}

func detectProduct(text string) string {
	lowerText := strings.ToLower(text)
	switch {
	case strings.Contains(lowerText, "card de credit"):
		return "Credit card"
	case strings.Contains(lowerText, "nevoi personale"):
		return "Personal loan"
	case strings.Contains(lowerText, "card"):
		return "Credit card"
	case strings.Contains(lowerText, "ipotec"):
		return "Mortgage"
	case strings.Contains(lowerText, "leasing"):
		return "Leasing"
	case strings.Contains(lowerText, "overdraft"):
		return "Overdraft"
	default:
		return "Credit facility"
	}
}

func detectStatus(text string) string {
	lowerText := strings.ToLower(text)
	switch {
	case strings.Contains(lowerText, "inchis") || strings.Contains(lowerText, "closed"):
		return "Closed"
	case strings.Contains(lowerText, "restant") || strings.Contains(lowerText, "intarzi"):
		return "Past due"
	default:
		return "Active"
	}
}

func fillAccountDates(account *Account, dates []string) {
	if len(dates) > 0 {
		account.OpenedDate = dates[0]
	}
	if len(dates) > 1 {
		account.ClosedDate = dates[1]
	}
}

func fillAccountAmounts(account *Account, amounts []float64) {
	if len(amounts) > 0 {
		account.BalanceRON = amounts[0]
	}
	if len(amounts) > 1 {
		account.LimitRON = amounts[1]
	}
	if len(amounts) > 2 {
		account.MonthlyRON = amounts[2]
	}
}

func fillPastDueAmount(account *Account, text string, amounts []float64) {
	lowerText := strings.ToLower(text)
	if strings.Contains(lowerText, "rest") || strings.Contains(lowerText, "intarzi") {
		account.PastDueRON = maxFloat(0, smallestPositive(amounts))
	}
}

func accountKey(account Account) string {
	return strings.ToLower(account.Creditor + account.Product + account.OpenedDate + fmt.Sprintf("%.2f", account.BalanceRON))
}

func sortAccountsByBalance(accounts []Account) {
	sort.SliceStable(accounts, func(left, right int) bool {
		if accounts[left].Status != accounts[right].Status {
			return accounts[left].Status == "Active"
		}
		return accounts[left].BalanceRON > accounts[right].BalanceRON
	})
}
