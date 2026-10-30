import type { E2EESearchQuery, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createMemorySearchIndexBackend } from '../../../../../../tests/mocks/client/memorySearchIndexBackend';

/** Provide deterministic query pages for controller tests, without browser storage. */
export const createTestSearchBackend = (): ISearchIndexBackend => {
	const backend = createMemorySearchIndexBackend();
	const hits = (query: E2EESearchQuery) =>
		[...backend.documents.values()]
			.filter(
				(doc) =>
					(!query.rid || doc.rid === query.rid) &&
					(!query.uid || doc.uid === query.uid) &&
					doc.ts >= (query.from ?? 0) &&
					doc.ts <= (query.to ?? Number.MAX_SAFE_INTEGER) &&
					doc.body.toLowerCase().includes(query.text.toLowerCase()),
			)
			.sort((a, b) => b.ts - a.ts || b.id.localeCompare(a.id))
			.map(({ body, ...doc }) => ({
				...doc,
				snippet: query.text ? body.replace(query.text, `<mark>${query.text}</mark>`) : body,
			}));
	return {
		...backend,
		open: async () => ({ schemaVersion: 1, encryptedAtRest: false, capabilities: { recentCursor: 1, lifecycleEvents: 1, close: 1 } }),
		search: async (query) => hits(query).slice(0, query.limit ?? 50),
		searchRecentPage: async ({ cursor, ...query }) => {
			const selected = hits(query).filter((hit) => !cursor || hit.ts < cursor.ts || (hit.ts === cursor.ts && hit.id < cursor.id));
			const page = selected.slice(0, query.limit ?? 50);
			const last = page.at(-1);
			return { hits: page, ...(last && selected.length > page.length && { nextCursor: { ts: last.ts, id: last.id } }) };
		},
		onIndexEvent: () => () => undefined,
		close: async () => undefined,
	};
};
