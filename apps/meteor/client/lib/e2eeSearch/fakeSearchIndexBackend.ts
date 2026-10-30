import { E2EE_SEARCH_LIMITS } from '@rocket.chat/desktop-api';
import type { E2EESearchDoc, E2EESearchHit, E2EESearchQuery, E2EESearchRoomState, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { WORD, clampLimit, fold, queryTokens, toFilterOnlySnippet, toSnippet, utf8Length } from './searchIndexText';

const compareIds = (left: string, right: string) => {
	const encoder = new TextEncoder();
	const a = encoder.encode(left);
	const b = encoder.encode(right);
	for (let index = 0; index < Math.min(a.length, b.length); index++) {
		if (a[index] !== b[index]) return a[index] - b[index];
	}
	return a.length - b.length;
};

/** Provide an explicit development-only index without persistent storage. */
export const createFakeSearchIndexBackend = (): ISearchIndexBackend => {
	let userId: string | undefined;
	let owner: string | undefined;
	const docs = new Map<string, E2EESearchDoc & { words: string[] }>();
	const states = new Map<string, E2EESearchRoomState>();
	const listeners = new Set<Parameters<NonNullable<ISearchIndexBackend['onIndexEvent']>>[0]>();
	const clear = () => {
		docs.clear();
		states.clear();
	};
	const assertOpen = () => {
		if (!userId) throw new Error('E2EE search index is not open');
	};
	const changed = () => {
		for (const listener of [...listeners]) listener({ type: 'changed' });
	};
	const hits = (query: E2EESearchQuery): E2EESearchHit[] => {
		assertOpen();
		const tokens = queryTokens(query.text);
		const filtersOnly = query.text.trim() === '' && [query.rid, query.uid, query.from, query.to].some((value) => value !== undefined);
		if (!tokens.length && !filtersOnly) return [];
		return [...docs.values()]
			.filter(
				(doc) =>
					(query.rid === undefined || doc.rid === query.rid) &&
					(query.uid === undefined || doc.uid === query.uid) &&
					doc.ts >= (query.from ?? 0) &&
					doc.ts <= (query.to ?? Number.MAX_SAFE_INTEGER) &&
					tokens.every((token) => doc.words.some((word) => word.startsWith(token))),
			)
			.map((doc) => ({ doc, score: doc.words.filter((word) => tokens.some((token) => word.startsWith(token))).length }))
			.sort((a, b) => (query.order === 'recent' ? 0 : b.score - a.score) || b.doc.ts - a.doc.ts || compareIds(b.doc.id, a.doc.id))
			.map(({ doc }) => ({
				id: doc.id,
				rid: doc.rid,
				...(doc.tmid !== undefined && { tmid: doc.tmid }),
				uid: doc.uid,
				username: doc.username,
				ts: doc.ts,
				snippet: tokens.length ? toSnippet(doc.body, tokens) : toFilterOnlySnippet(doc.body),
			}));
	};
	return {
		async open(scope) {
			listeners.clear();
			if (owner !== undefined && owner !== scope.userId) clear();
			userId = scope.userId;
			owner = scope.userId;
			return { schemaVersion: 1, encryptedAtRest: false, capabilities: { recentCursor: 1, lifecycleEvents: 1, close: 1 } };
		},
		async upsert(list) {
			assertOpen();
			if (
				list.length > E2EE_SEARCH_LIMITS.maxBatchDocuments ||
				list.some((doc) => doc.body.length > E2EE_SEARCH_LIMITS.maxDocumentBodyCodeUnits) ||
				list.reduce((sum, doc) => sum + doc.body.length, 0) > E2EE_SEARCH_LIMITS.maxBatchBodyCodeUnits
			)
				throw new RangeError('Search document batch exceeds shared limits');
			for (const doc of list) docs.set(doc.id, { ...doc, words: (doc.body.normalize('NFKC').match(WORD) ?? []).map(fold) });
			changed();
		},
		async remove(ids) {
			assertOpen();
			ids.forEach((id) => docs.delete(id));
			changed();
		},
		async removeRoom(rid) {
			assertOpen();
			for (const [id, doc] of docs) if (doc.rid === rid) docs.delete(id);
			states.delete(rid);
			changed();
		},
		async listRooms() {
			assertOpen();
			return [...new Set([...docs.values()].map((doc) => doc.rid).concat([...states.keys()]))].sort();
		},
		async search(query) {
			return hits(query).slice(0, clampLimit(query.limit));
		},
		async searchRecentPage({ cursor, ...query }) {
			if (cursor && (!Number.isSafeInteger(cursor.ts) || typeof cursor.id !== 'string' || !cursor.id))
				throw new RangeError('Invalid recent search cursor');
			const selected = hits({ ...query, order: 'recent' }).filter(
				(hit) => !cursor || hit.ts < cursor.ts || (hit.ts === cursor.ts && compareIds(hit.id, cursor.id) < 0),
			);
			const page = selected.slice(0, clampLimit(query.limit));
			const last = page.at(-1);
			return { hits: page, ...(last && selected.length > page.length && { nextCursor: { ts: last.ts, id: last.id } }) };
		},
		onIndexEvent(listener) {
			assertOpen();
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		async getRoomState(rid) {
			assertOpen();
			const state = states.get(rid);
			return state && { ...state };
		},
		async setRoomState(rid, state) {
			assertOpen();
			states.set(rid, { ...state });
		},
		async stats() {
			assertOpen();
			return {
				docs: docs.size,
				bytes: [...docs.values()].reduce((sum, doc) => sum + utf8Length(doc.body), 0),
				rooms: new Set([...docs.values()].map((doc) => doc.rid)).size,
			};
		},
		async wipe(scope) {
			if (scope && scope.userId !== owner) return;
			clear();
			listeners.clear();
			userId = undefined;
			owner = undefined;
		},
		async close() {
			listeners.clear();
			userId = undefined;
		},
	};
};
