import { E2EE_SEARCH_LIMITS } from '@rocket.chat/desktop-api';

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

// Match unicode61 case folding, including word-final sigma.
export const fold = (word: string): string =>
	word
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/\u03C2/gu, '\u03C3');

export const queryTokens = (text: string): string[] =>
	(text.normalize('NFKC').match(WORD) ?? []).map(fold).filter(Boolean).slice(0, E2EE_SEARCH_LIMITS.maxQueryTokens);

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
	if (limit === undefined || !Number.isFinite(limit)) return E2EE_SEARCH_LIMITS.defaultResults;
	return Math.min(E2EE_SEARCH_LIMITS.maxResults, Math.max(1, Math.floor(limit)));
};

const matchesAny = (word: string, tokens: string[]): boolean => {
	const folded = fold(word);
	return tokens.some((token) => folded.startsWith(token));
};

// Return escaped text with only <mark> elements as highlight markup.
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

const FILTER_ONLY_SNIPPET_LENGTH = 80;

export const toFilterOnlySnippet = (body: string): string => {
	const chars = [...body];
	if (chars.length <= FILTER_ONLY_SNIPPET_LENGTH) return escapeHtml(body);
	return `${escapeHtml(chars.slice(0, FILTER_ONLY_SNIPPET_LENGTH).join(''))}…`;
};
