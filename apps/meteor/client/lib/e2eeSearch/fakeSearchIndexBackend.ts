import type { E2EESearchDoc, E2EESearchHit, E2EESearchRoomState, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { WORD, clampLimit, fold, queryTokens, toFilterOnlySnippet, toSnippet, utf8Length } from './searchIndexText';

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

		async listRooms() {
			assertOpen();
			return [...new Set([...[...docs.values()].map((doc) => doc.rid), ...roomStates.keys()])].sort();
		},

		async search(query) {
			assertOpen();
			const tokens = queryTokens(query.text);
			// An empty text with filters lists the newest messages of the filters. No filter at all finds nothing.
			const filtered = query.rid !== undefined || query.uid !== undefined || query.from !== undefined || query.to !== undefined;
			const filtersOnly = query.text.trim() === '' && filtered;
			if (tokens.length === 0 && !filtersOnly) return [];

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
				snippet: tokens.length === 0 ? toFilterOnlySnippet(doc.body) : toSnippet(doc.body, tokens),
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

		async close() {
			userId = undefined;
		},
	};
};
