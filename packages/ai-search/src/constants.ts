export const AI_LICENSE_MODULE = 'chat.rocket.rc-ai';

export const AI_SEARCH_PAGE_SIZE = 5;
export const AI_SEARCH_RESULTS_PAGE_SIZE = 8;
export const AI_SEARCH_FILTER_SUGGESTION_LIMIT = 5;
export const AI_SEARCH_ROOM_LOOKUP_LIMIT = 20;
export const MAX_INTELLIGENT_SEARCH_RESULTS = 50;
// Candidate pool retrieved from each retriever before fusion. Implementation detail, never exposed to
// admins, and tuned on the measured quality/latency frontier rather than on quality alone:
// a pool of 20 costs the same as the old pool of 5 (p50 584ms vs 588ms) but lifts nDCG@10 by ~7%,
// while 100 is both slower (p50 1490ms) and *worse* than 50. Hence floor 20, cap 50.
// See docs/features/ai-search-hybrid-benchmark.md.
export const INTELLIGENT_SEARCH_CANDIDATE_MULTIPLIER = 3;
export const MIN_INTELLIGENT_SEARCH_CANDIDATES = 20;
export const MAX_INTELLIGENT_SEARCH_CANDIDATES = 50;
export const INTELLIGENT_SEARCH_RRF_CONSTANT = 60;
export const DEFAULT_INTELLIGENT_SEARCH_SEMANTIC_WEIGHT = 50;
export const DEFAULT_INTELLIGENT_SEARCH_RECENCY_HALF_LIFE_DAYS = 30;
export const MAX_SEARCH_FILTER_VALUES = 25;
export const MAX_ROOM_SEARCH_PATTERN_LENGTH = 64;
export const MAX_AI_SERVICE_RESPONSE_SIZE = 5 * 1024 * 1024;
export const MAX_SOURCE_MESSAGE_LENGTH = 700;
export const MAX_SEARCH_ANSWER_MESSAGES = 20;
export const MAX_SEARCH_ANSWER_TEXT_LENGTH = 1600;
