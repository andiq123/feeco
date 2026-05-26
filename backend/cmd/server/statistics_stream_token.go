package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"strconv"
	"strings"
	"time"
)

const statisticsStreamTokenMaxAge = 90 * time.Second

func validStatisticsStreamToken(token string, secret string, now time.Time) bool {
	if token == "" || secret == "" {
		return false
	}

	payload, signature, ok := strings.Cut(token, ".")
	if !ok || payload == "" || signature == "" {
		return false
	}

	expectedSignature := statisticsStreamSignature(payload, secret)
	if subtle.ConstantTimeCompare([]byte(signature), []byte(expectedSignature)) != 1 {
		return false
	}

	decodedPayload, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		return false
	}

	expiresAt, err := strconv.ParseInt(string(decodedPayload), 10, 64)
	if err != nil {
		return false
	}

	expiresAtTime := time.Unix(expiresAt, 0)
	return now.Before(expiresAtTime) && now.Add(statisticsStreamTokenMaxAge).After(expiresAtTime)
}

func statisticsStreamSignature(payload string, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	return hex.EncodeToString(mac.Sum(nil))
}
