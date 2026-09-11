export const AI_LICENSE_MODULE = 'chat.rocket.rc-ai';

export const AI_SEARCH_PAGE_SIZE = 5;
export const AI_SEARCH_RESULTS_PAGE_SIZE = 8;
export const AI_SEARCH_FILTER_SUGGESTION_LIMIT = 5;
export const AI_SEARCH_ROOM_LOOKUP_LIMIT = 20;
export const MAX_INTELLIGENT_SEARCH_RESULTS = 50;
// Per-retriever candidate pool. Internal, and sized on a measured quality/latency frontier rather than
// quality alone. The cap must stay above MAX_INTELLIGENT_SEARCH_RESULTS, otherwise the largest page
// over-fetches nothing and permission filtering can return a short page.
export const INTELLIGENT_SEARCH_CANDIDATE_MULTIPLIER = 3;
export const MIN_INTELLIGENT_SEARCH_CANDIDATES = 20;
export const MAX_INTELLIGENT_SEARCH_CANDIDATES = 100;
export const INTELLIGENT_SEARCH_RRF_CONSTANT = 60;
export const DEFAULT_INTELLIGENT_SEARCH_SEMANTIC_WEIGHT = 50;
export const DEFAULT_INTELLIGENT_SEARCH_RECENCY_HALF_LIFE_DAYS = 30;
export const MAX_SEARCH_FILTER_VALUES = 25;
export const MAX_ROOM_SEARCH_PATTERN_LENGTH = 64;
export const MAX_AI_SERVICE_RESPONSE_SIZE = 5 * 1024 * 1024;
export const MAX_SOURCE_MESSAGE_LENGTH = 700;
export const MAX_SEARCH_ANSWER_MESSAGES = 20;
export const MAX_SEARCH_ANSWER_TEXT_LENGTH = 1600;
