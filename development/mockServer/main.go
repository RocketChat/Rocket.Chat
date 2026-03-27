package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

// MockResponse defines what a mocked endpoint should return.
type MockResponse struct {
	StatusCode int             `json:"status_code"`
	Headers    map[string]string `json:"headers,omitempty"`
	Body       json.RawMessage `json:"body"`
	// Times: how many times to serve this mock. 0 = unlimited (sticky).
	Times int `json:"times,omitempty"`
}

// MockRule is a queued mock for a specific method+path.
type MockRule struct {
	MockResponse
	remaining int // -1 = unlimited
}

type server struct {
	mu    sync.Mutex
	mocks map[string][]*MockRule // key = "METHOD /path"
	log   []RequestLog
}

// RequestLog records each proxied request for later inspection.
type RequestLog struct {
	Timestamp string          `json:"timestamp"`
	Method    string          `json:"method"`
	Path      string          `json:"path"`
	Headers   map[string]string `json:"headers"`
	Body      json.RawMessage `json:"body,omitempty"`
	Matched   bool            `json:"matched"`
}

// --- Control plane handlers ---

// POST /__mock/set — register a mock response.
//
//	{
//	  "method": "POST",
//	  "path": "/protocol/openid-connect/token",
//	  "response": { "status_code": 200, "body": {...}, "headers": {...}, "times": 1 }
//	}
func (s *server) handleSet(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Method   string       `json:"method"`
		Path     string       `json:"path"`
		Response MockResponse `json:"response"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":%q}`, err.Error()), http.StatusBadRequest)
		return
	}
	if req.Method == "" {
		req.Method = "POST"
	}
	if req.Response.StatusCode == 0 {
		req.Response.StatusCode = 200
	}

	remaining := req.Response.Times
	if remaining == 0 {
		remaining = -1 // unlimited
	}

	key := req.Method + " " + req.Path
	rule := &MockRule{MockResponse: req.Response, remaining: remaining}

	s.mu.Lock()
	s.mocks[key] = append(s.mocks[key], rule)
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"ok":true,"key":%q}`, key)
}

// POST /__mock/set-many — register multiple mocks at once.
func (s *server) handleSetMany(w http.ResponseWriter, r *http.Request) {
	var reqs []struct {
		Method   string       `json:"method"`
		Path     string       `json:"path"`
		Response MockResponse `json:"response"`
	}
	if err := json.NewDecoder(r.Body).Decode(&reqs); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":%q}`, err.Error()), http.StatusBadRequest)
		return
	}

	s.mu.Lock()
	for _, req := range reqs {
		if req.Method == "" {
			req.Method = "POST"
		}
		if req.Response.StatusCode == 0 {
			req.Response.StatusCode = 200
		}
		remaining := req.Response.Times
		if remaining == 0 {
			remaining = -1
		}
		key := req.Method + " " + req.Path
		s.mocks[key] = append(s.mocks[key], &MockRule{MockResponse: req.Response, remaining: remaining})
	}
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"ok":true,"count":%d}`, len(reqs))
}

// DELETE /__mock/reset — clear all mocks and logs.
func (s *server) handleReset(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	s.mocks = make(map[string][]*MockRule)
	s.log = nil
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"ok":true}`)
}

// GET /__mock/log — return captured requests.
func (s *server) handleLog(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	logs := s.log
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

// GET /__mock/health — liveness check.
func (s *server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"status":"ok"}`)
}

// --- Catch-all handler ---

func (s *server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Route control-plane endpoints.
	switch {
	case r.URL.Path == "/__mock/set" && r.Method == http.MethodPost:
		s.handleSet(w, r)
		return
	case r.URL.Path == "/__mock/set-many" && r.Method == http.MethodPost:
		s.handleSetMany(w, r)
		return
	case r.URL.Path == "/__mock/reset" && (r.Method == http.MethodDelete || r.Method == http.MethodPost):
		s.handleReset(w, r)
		return
	case r.URL.Path == "/__mock/log" && r.Method == http.MethodGet:
		s.handleLog(w, r)
		return
	case r.URL.Path == "/__mock/health" && r.Method == http.MethodGet:
		s.handleHealth(w, r)
		return
	}

	// Record the incoming request.
	var bodyBytes json.RawMessage
	if r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&bodyBytes)
	}

	headers := make(map[string]string)
	for k := range r.Header {
		headers[k] = r.Header.Get(k)
	}

	entry := RequestLog{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Method:    r.Method,
		Path:      r.URL.Path,
		Headers:   headers,
		Body:      bodyBytes,
	}

	// Find a matching mock.
	key := r.Method + " " + r.URL.Path

	s.mu.Lock()
	rules := s.mocks[key]
	var matched *MockRule
	if len(rules) > 0 {
		matched = rules[0]
		if matched.remaining > 0 {
			matched.remaining--
			if matched.remaining == 0 {
				// Remove exhausted rule.
				s.mocks[key] = rules[1:]
			}
		}
		// remaining == -1 means unlimited, keep it.
	}
	entry.Matched = matched != nil
	s.log = append(s.log, entry)
	s.mu.Unlock()

	if matched == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintf(w, `{"error":"no mock registered","method":%q,"path":%q}`, r.Method, r.URL.Path)
		log.Printf("MISS %s %s", r.Method, r.URL.Path)
		return
	}

	// Serve the mocked response.
	for k, v := range matched.Headers {
		w.Header().Set(k, v)
	}
	if w.Header().Get("Content-Type") == "" {
		w.Header().Set("Content-Type", "application/json")
	}
	w.WriteHeader(matched.StatusCode)
	w.Write(matched.Body)
	log.Printf("HIT  %s %s → %d", r.Method, r.URL.Path, matched.StatusCode)
}

func main() {
	if len(os.Args) > 1 && os.Args[1] == "-healthcheck" {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		resp, err := http.Get("http://127.0.0.1:" + port + "/__mock/health")
		if err != nil || resp.StatusCode != 200 {
			os.Exit(1)
		}
		os.Exit(0)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	s := &server{
		mocks: make(map[string][]*MockRule),
	}

	log.Printf("mock-server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, s); err != nil {
		log.Fatal(err)
	}
}
