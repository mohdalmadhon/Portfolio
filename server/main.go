package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/mail"
	"net/smtp"
	"os"
	"strings"
	"sync"
	"time"
	"unicode/utf8"
)

type message struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Message string `json:"message"`
	Gotcha  string `json:"_gotcha"`
}

type limiter struct {
	mu     sync.Mutex
	hits   map[string][]time.Time
	limit  int
	window time.Duration
}

func (l *limiter) allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	recent := l.hits[key][:0]
	for _, t := range l.hits[key] {
		if now.Sub(t) < l.window {
			recent = append(recent, t)
		}
	}
	if len(recent) >= l.limit {
		l.hits[key] = recent
		return false
	}
	l.hits[key] = append(recent, now)
	return true
}

func env(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func clean(s string) string {
	return strings.TrimSpace(strings.NewReplacer("\r", " ", "\n", " ").Replace(s))
}

func validate(m *message) error {
	m.Name = clean(m.Name)
	m.Email = clean(m.Email)
	m.Message = strings.TrimSpace(m.Message)
	if n := utf8.RuneCountInString(m.Name); n < 2 || n > 80 {
		return errors.New("Please enter a name between 2 and 80 characters.")
	}
	addr, err := mail.ParseAddress(m.Email)
	if err != nil || addr.Address != m.Email || len(m.Email) > 200 {
		return errors.New("Please enter a valid email address.")
	}
	if n := utf8.RuneCountInString(m.Message); n < 10 || n > 4000 {
		return errors.New("Message must be between 10 and 4000 characters.")
	}
	return nil
}

func clientIP(r *http.Request) string {
	if env("TRUST_PROXY", "") == "1" {
		if f := r.Header.Get("X-Forwarded-For"); f != "" {
			return strings.TrimSpace(strings.Split(f, ",")[0])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func send(m message) error {
	host := env("SMTP_HOST", "")
	user := env("SMTP_USER", "")
	pass := os.Getenv("SMTP_PASS")
	to := env("CONTACT_TO", user)
	from := env("CONTACT_FROM", user)
	if host == "" || to == "" || from == "" {
		return errors.New("smtp not configured")
	}
	port := env("SMTP_PORT", "587")
	subject := fmt.Sprintf("Portfolio message from %s", m.Name)
	body := fmt.Sprintf("Name: %s\r\nEmail: %s\r\n\r\n%s\r\n", m.Name, m.Email, strings.ReplaceAll(m.Message, "\n", "\r\n"))
	msg := "From: " + from + "\r\n" +
		"To: " + to + "\r\n" +
		"Reply-To: " + m.Email + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/plain; charset=UTF-8\r\n\r\n" + body
	auth := smtp.PlainAuth("", user, pass, host)
	return smtp.SendMail(host+":"+port, auth, from, []string{to}, []byte(msg))
}

func main() {
	origins := map[string]bool{}
	for _, o := range strings.Split(env("ALLOWED_ORIGINS", ""), ",") {
		if o = strings.TrimRight(strings.TrimSpace(o), "/"); o != "" {
			origins[o] = true
		}
	}
	rl := &limiter{hits: map[string][]time.Time{}, limit: 5, window: 10 * time.Minute}

	writeJSON := func(w http.ResponseWriter, status int, v any) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		_ = json.NewEncoder(w).Encode(v)
	}

	http.HandleFunc("/contact", func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed."})
			return
		}
		if len(origins) > 0 && !origins[origin] {
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "Origin not allowed."})
			return
		}
		if !rl.allow(clientIP(r)) {
			writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "Too many messages. Please try again later."})
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
		var m message
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request."})
			return
		}
		if m.Gotcha != "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request."})
			return
		}
		if err := validate(&m); err != nil {
			writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
			return
		}
		if err := send(m); err != nil {
			log.Printf("send failed: %v", err)
			writeJSON(w, http.StatusBadGateway, map[string]string{"error": "Your message could not be delivered right now."})
			return
		}
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
	})

	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
	})

	addr := ":" + env("PORT", "8080")
	log.Printf("contact server listening on %s", addr)
	srv := &http.Server{Addr: addr, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 20 * time.Second}
	log.Fatal(srv.ListenAndServe())
}
