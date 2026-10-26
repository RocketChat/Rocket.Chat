import type { E2EESearchDoc, E2EESearchHit, E2EESearchRoomState, ISearchIndexBackend } from '@rocket.chat/desktop-api';

const DEFAULT_SEARCH_LIMIT = 50;
const MAX_SEARCH_LIMIT = 100;
const MAX_QUERY_TOKENS = 16;

// Letters, digits and combining marks, so a decomposed accent stays in its word.
const WORD = /[\p{L}\p{N}\p{M}]+/gu;

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
};

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

// The same folding as the desktop index (`unicode61 remove_diacritics 2`): no case and no diacritic difference.
const fold = (word: string): string => word.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

const queryTokens = (text: string): string[] =>
	(text.normalize('NFKC').match(WORD) ?? []).map(fold).filter(Boolean).slice(0, MAX_QUERY_TOKENS);

const utf8Length = (text: string): number => {
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

const clampLimit = (limit: number | undefined): number => {
	if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_SEARCH_LIMIT;
	return Math.min(MAX_SEARCH_LIMIT, Math.max(1, Math.floor(limit)));
};

const matchesAny = (word: string, tokens: string[]): boolean => {
	const folded = fold(word);
	return tokens.some((token) => folded.startsWith(token));
};

// Escapes the message text and adds only `<mark>` tags, so text from other users never reaches the page as HTML.
const toSnippet = (body: string, tokens: string[]): string => {
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

/**
 * A memory-only search index with the same contract as the desktop index. Development builds use it to work on E2EE
 * search in a browser. It never writes to disk, and a reload loses it.
 */
export const createFakeSearchIndexBackend = (): ISearchIndexBackend => {
	let userId: string | undefined;
	const docs = new Map<string, E2EESearchDoc & { words: string[] }>();
	const roomStates = new Map<string, E2EESearchRoomState>();

	const clear = () => {
		docs.clear();
		roomStates.clear();
	};

	const assertOpen = () => {
		if (userId === undefined) throw new Error('E2EE search index is not open');
	};

	return {
		async open(scope) {
			if (userId !== undefined && userId !== scope.userId) clear();
			userId = scope.userId;
			return { schemaVersion: 1, encryptedAtRest: false };
		},

		async upsert(list) {
			assertOpen();
			for (const doc of list) {
				docs.set(doc.id, { ...doc, words: (doc.body.normalize('NFKC').match(WORD) ?? []).map(fold) });
			}
		},

		async remove(ids) {
			assertOpen();
			for (const id of ids) docs.delete(id);
		},

		async removeRoom(rid) {
			assertOpen();
			for (const [id, doc] of docs) {
				if (doc.rid === rid) docs.delete(id);
			}
			roomStates.delete(rid);
		},

		async search(query) {
			assertOpen();
			const tokens = queryTokens(query.text);
			if (tokens.length === 0) return [];

			const from = query.from ?? 0;
			const to = query.to ?? Number.MAX_SAFE_INTEGER;
			const scored = [...docs.values()]
				.filter(
					(doc) =>
						(query.rid === undefined || doc.rid === query.rid) &&
						(query.uid === undefined || doc.uid === query.uid) &&
						doc.ts >= from &&
						doc.ts <= to &&
						tokens.every((token) => doc.words.some((word) => word.startsWith(token))),
				)
				.map((doc) => ({ doc, score: doc.words.filter((word) => tokens.some((token) => word.startsWith(token))).length }));

			scored.sort((a, b) => (query.order === 'recent' ? 0 : b.score - a.score) || b.doc.ts - a.doc.ts);

			return scored.slice(0, clampLimit(query.limit)).map(({ doc }): E2EESearchHit => ({
				id: doc.id,
				rid: doc.rid,
				...(doc.tmid !== undefined && { tmid: doc.tmid }),
				uid: doc.uid,
				username: doc.username,
				ts: doc.ts,
				snippet: toSnippet(doc.body, tokens),
			}));
		},

		async getRoomState(rid) {
			assertOpen();
			const state = roomStates.get(rid);
			return state && { ...state };
		},

		async setRoomState(rid, state) {
			assertOpen();
			roomStates.set(rid, { ...state });
		},

		async stats() {
			assertOpen();
			const values = [...docs.values()];
			return {
				docs: values.length,
				bytes: values.reduce((sum, doc) => sum + utf8Length(doc.body), 0),
				rooms: new Set(values.map((doc) => doc.rid)).size,
			};
		},

		async wipe() {
			clear();
			userId = undefined;
		},
	};
};
