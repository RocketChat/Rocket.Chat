// The text rules that every E2EE search index follows, so a browser index and the desktop index give the same hits.

const DEFAULT_SEARCH_LIMIT = 50;
const MAX_SEARCH_LIMIT = 100;
const MAX_QUERY_TOKENS = 16;

// Letters, digits and combining marks, so a decomposed accent stays in its word.
export const WORD = /[\p{L}\p{N}\p{M}]+/gu;

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
};

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

// The same folding as the desktop index (`unicode61 remove_diacritics 2`): no case and no diacritic difference.
export const fold = (word: string): string => word.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

export const queryTokens = (text: string): string[] =>
	(text.normalize('NFKC').match(WORD) ?? []).map(fold).filter(Boolean).slice(0, MAX_QUERY_TOKENS);

export const utf8Length = (text: string): number => {
	let bytes = 0;
	for (const char of text) {
		const codePoint = char.codePointAt(0) ?? 0;
		if (codePoint < 0x80) bytes += 1;
		else if (codePoint < 0x800) bytes += 2;
		else if (codePoint < 0x10000) bytes += 3;
		else bytes += 4;
	}
	return bytes;
};

export const clampLimit = (limit: number | undefined): number => {
	if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_SEARCH_LIMIT;
	return Math.min(MAX_SEARCH_LIMIT, Math.max(1, Math.floor(limit)));
};

const matchesAny = (word: string, tokens: string[]): boolean => {
	const folded = fold(word);
	return tokens.some((token) => folded.startsWith(token));
};

// Escapes the message text and adds only `<mark>` tags, so text from other users never reaches the page as HTML.
export const toSnippet = (body: string, tokens: string[]): string => {
	let html = '';
	let last = 0;
	for (const match of body.matchAll(WORD)) {
		const index = match.index ?? 0;
		const word = match[0];
		html += escapeHtml(body.slice(last, index));
		html += matchesAny(word, tokens) ? `<mark>${escapeHtml(word)}</mark>` : escapeHtml(word);
		last = index + word.length;
	}
	return html + escapeHtml(body.slice(last));
};

// A hit of a query with no words has no match: the snippet is the escaped start of the body, as in the desktop index.
const FILTER_ONLY_SNIPPET_LENGTH = 80;

export const toFilterOnlySnippet = (body: string): string => {
	const chars = [...body];
	if (chars.length <= FILTER_ONLY_SNIPPET_LENGTH) return escapeHtml(body);
	return `${escapeHtml(chars.slice(0, FILTER_ONLY_SNIPPET_LENGTH).join(''))}…`;
};
