import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { E2EESearchDoc, E2EESearchRecentCursor, E2EESearchRecentPage, ISearchIndexBackend } from '../src/e2eeSearch.ts';

export const describeRecentPagesContract = (name: string, createBackend: () => Promise<ISearchIndexBackend>): void => {
	describe(name, () => {
		it('uses UTF-8 binary ID order for Unicode timestamp ties', async () => {
			const backend = await createBackend();
			try {
				await backend.open({ userId: 'unicode-contract-user', wrapKey: new Uint8Array(32).fill(1) });
				assert.ok(backend.searchRecentPage);
				const ids = ['a', 'z', 'é', '', '😀'];
				await backend.upsert(
					ids.map((id) => ({
						id,
						rid: 'unicode-room',
						uid: 'u1',
						username: 'user',
						ts: 1000,
						updatedAt: 1000,
						kind: 'text',
						body: 'needle',
					})),
				);
				const visited: string[] = [];
				let cursor: E2EESearchRecentCursor | undefined;
				for (let index = 0; index <= ids.length; index++) {
					const page: E2EESearchRecentPage = await backend.searchRecentPage({ text: 'needle', rid: 'unicode-room', limit: 1, cursor });
					visited.push(...page.hits.map(({ id }) => id));
					if (!page.nextCursor) break;
					cursor = page.nextCursor;
				}
				assert.deepEqual(
					visited,
					[...ids].sort((left, right) => Buffer.compare(Buffer.from(right), Buffer.from(left))),
				);
			} finally {
				await backend.wipe();
				await backend.close?.();
			}
		});

		it('visits 205 matching timestamp ties once and excludes records outside the room filter', async () => {
			const backend = await createBackend();
			try {
				const opened = await backend.open({ userId: 'contract-user', wrapKey: new Uint8Array(32).fill(1) });
				assert.deepEqual(opened.capabilities, { recentCursor: 1, lifecycleEvents: 1, close: 1 });
				assert.ok(backend.searchRecentPage);
				const documents: E2EESearchDoc[] = Array.from({ length: 205 }, (_, index) => ({
					id: `message-${String(index).padStart(3, '0')}`,
					rid: 'room-1',
					uid: 'user-1',
					username: 'user',
					ts: 1000,
					updatedAt: 1000,
					kind: 'text',
					body: 'needle',
				}));
				await backend.upsert([...documents, { ...documents[0], id: 'excluded', rid: 'room-2' }]);
				const visited: string[] = [];
				let cursor: E2EESearchRecentCursor | undefined;
				for (let pageNumber = 0; pageNumber < 4; pageNumber++) {
					const page: E2EESearchRecentPage = await backend.searchRecentPage({ text: 'needle', rid: 'room-1', limit: 100, cursor });
					assert.ok(page.hits.length <= 100);
					visited.push(...page.hits.map(({ id }) => id));
					if (!page.nextCursor) break;
					const last = page.hits.at(-1);
					assert.ok(last);
					assert.deepEqual(page.nextCursor, { ts: last.ts, id: last.id });
					assert.notDeepEqual(page.nextCursor, cursor);
					cursor = page.nextCursor;
				}
				assert.deepEqual(visited, documents.map(({ id }) => id).reverse());
				assert.equal(new Set(visited).size, 205);
			} finally {
				await backend.wipe();
				await backend.close?.();
			}
		});
	});
};
