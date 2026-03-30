package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type MockResponse struct {
	StatusCode int               `json:"status_code"`
	Headers    map[string]string `json:"headers,omitempty"`
	Body       json.RawMessage   `json:"body"`
	Times      int               `json:"times,omitempty"`
}

type MockRule struct {
	MockResponse
	remaining int // -1 = unlimited
}

type DynamicBulkRule struct {
	PermitValues    []string `json:"permit_values"`
	DefaultDecision string   `json:"default_decision"`
}

type server struct {
	mu          sync.Mutex
	mocks       map[string][]*MockRule
	dynamicBulk *DynamicBulkRule
	log         []RequestLog
}

type RequestLog struct {
	Timestamp string            `json:"timestamp"`
	Method    string            `json:"method"`
	Path      string            `json:"path"`
	Headers   map[string]string `json:"headers"`
	Body      json.RawMessage   `json:"body,omitempty"`
	Matched   bool              `json:"matched"`
}

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
		remaining = -1
	}

	key := req.Method + " " + req.Path
	rule := &MockRule{MockResponse: req.Response, remaining: remaining}

	s.mu.Lock()
	s.mocks[key] = append(s.mocks[key], rule)
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"ok":true,"key":%q}`, key)
}

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

// POST /__mock/set-bulk-decision — register a dynamic bulk decision handler.
//
//	{
//	  "permit_values": ["admin@test.com"],
//	  "default_decision": "DECISION_DENY"
//	}
//
// When a GetDecisionBulk request comes in, the mock inspects each entity's
// emailAddress or id field. If the value is in permit_values → DECISION_PERMIT,
// otherwise → default_decision.
func (s *server) handleSetBulkDecision(w http.ResponseWriter, r *http.Request) {
	var rule DynamicBulkRule
	if err := json.NewDecoder(r.Body).Decode(&rule); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":%q}`, err.Error()), http.StatusBadRequest)
		return
	}
	if rule.DefaultDecision == "" {
		rule.DefaultDecision = "DECISION_DENY"
	}

	s.mu.Lock()
	s.dynamicBulk = &rule
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"ok":true}`)
}

func (s *server) handleReset(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	s.mocks = make(map[string][]*MockRule)
	s.dynamicBulk = nil
	s.log = nil
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"ok":true}`)
}

func (s *server) handleLog(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	logs := s.log
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (s *server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"status":"ok"}`)
}

// buildDynamicBulkResponse inspects a GetDecisionBulk request body and returns
// per-entity decisions based on the dynamic rule.
func (s *server) buildDynamicBulkResponse(rule *DynamicBulkRule, body json.RawMessage) json.RawMessage {
	var req struct {
		DecisionRequests []struct {
			EntityIdentifier struct {
				EntityChain struct {
					Entities []json.RawMessage `json:"entities"`
				} `json:"entityChain"`
			} `json:"entityIdentifier"`
			Resources []struct {
				EphemeralId string `json:"ephemeralId"`
			} `json:"resources"`
		} `json:"decisionRequests"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		log.Printf("dynamic bulk: failed to parse request: %v", err)
		return []byte(`{"decisionResponses":[]}`)
	}

	permitSet := make(map[string]bool, len(rule.PermitValues))
	for _, v := range rule.PermitValues {
		permitSet[strings.ToLower(v)] = true
	}

	type resourceDecision struct {
		Decision            string `json:"decision"`
		EphemeralResourceId string `json:"ephemeralResourceId,omitempty"`
	}
	type decisionResponse struct {
		ResourceDecisions []resourceDecision `json:"resourceDecisions"`
	}

	var responses []decisionResponse
	for _, dr := range req.DecisionRequests {
		entityValue := extractEntityValue(dr.EntityIdentifier.EntityChain.Entities)
		decision := rule.DefaultDecision
		if permitSet[strings.ToLower(entityValue)] {
			decision = "DECISION_PERMIT"
		}

		var rds []resourceDecision
		for _, res := range dr.Resources {
			rds = append(rds, resourceDecision{
				Decision:            decision,
				EphemeralResourceId: res.EphemeralId,
			})
		}
		if len(rds) == 0 {
			rds = append(rds, resourceDecision{Decision: decision})
		}
		responses = append(responses, decisionResponse{ResourceDecisions: rds})
	}

	result, _ := json.Marshal(map[string]interface{}{
		"decisionResponses": responses,
	})
	return result
}

// extractEntityValue pulls the emailAddress or id from an entity object.
func extractEntityValue(entities []json.RawMessage) string {
	for _, raw := range entities {
		var entity map[string]interface{}
		if err := json.Unmarshal(raw, &entity); err != nil {
			continue
		}
		if v, ok := entity["emailAddress"].(string); ok {
			return v
		}
		if v, ok := entity["id"].(string); ok {
			return v
		}
	}
	return ""
}

func (s *server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.URL.Path == "/__mock/set" && r.Method == http.MethodPost:
		s.handleSet(w, r)
		return
	case r.URL.Path == "/__mock/set-many" && r.Method == http.MethodPost:
		s.handleSetMany(w, r)
		return
	case r.URL.Path == "/__mock/set-bulk-decision" && r.Method == http.MethodPost:
		s.handleSetBulkDecision(w, r)
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

	key := r.Method + " " + r.URL.Path

	s.mu.Lock()

	// Check for dynamic bulk decision handler first (only for GetDecisionBulk).
	if strings.HasSuffix(r.URL.Path, "/GetDecisionBulk") && s.dynamicBulk != nil {
		rule := s.dynamicBulk
		entry.Matched = true
		s.log = append(s.log, entry)
		s.mu.Unlock()

		responseBody := s.buildDynamicBulkResponse(rule, bodyBytes)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(responseBody)
		log.Printf("HIT  %s %s → 200 (dynamic bulk)", r.Method, r.URL.Path)
		return
	}

	rules := s.mocks[key]
	var matched *MockRule
	if len(rules) > 0 {
		matched = rules[0]
		if matched.remaining > 0 {
			matched.remaining--
			if matched.remaining == 0 {
				s.mocks[key] = rules[1:]
			}
		}
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
