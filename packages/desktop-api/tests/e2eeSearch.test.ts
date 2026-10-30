import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { E2EE_SEARCH_LIMITS } from '../src/e2eeSearch.ts';
import type { E2EESearchCapabilities, E2EESearchRecentQuery, ISearchIndexBackend } from '../src/e2eeSearch.ts';

const legacy: ISearchIndexBackend = {
	open: async () => ({ schemaVersion: 1, encryptedAtRest: false }),
	upsert: async () => undefined,
	remove: async () => undefined,
	removeRoom: async () => undefined,
	listRooms: async () => [],
	search: async () => [],
	getRoomState: async () => undefined,
	setRoomState: async () => undefined,
	stats: async () => ({ docs: 0, bytes: 0, rooms: 0 }),
	wipe: async () => undefined,
};

// Keep the old contract valid without the optional cursor, event, and close methods.
const legacyQuery: Parameters<ISearchIndexBackend['search']>[0] = { text: 'needle', order: 'relevance' };
const recentQuery: E2EESearchRecentQuery = { text: 'needle', cursor: { ts: 1000, id: 'message-100' } };
const capabilities: E2EESearchCapabilities = { recentCursor: 1, lifecycleEvents: 1, close: 1 };

// @ts-expect-error Recent-page queries have no relevance order.
const invalidRecent: E2EESearchRecentQuery = { text: 'needle', order: 'relevance' };
// @ts-expect-error Advertising only some capabilities is not supported.
const partialCapabilities: E2EESearchCapabilities = { recentCursor: 1 };
void invalidRecent;
void partialCapabilities;

describe('E2EE search bridge contract', () => {
	it('keeps legacy backends and search queries valid', async () => {
		assert.deepEqual(await legacy.search(legacyQuery), []);
		assert.equal(legacy.searchRecentPage, undefined);
		assert.equal(legacy.onIndexEvent, undefined);
		assert.equal(legacy.close, undefined);
		assert.deepEqual(await legacy.open({ userId: 'user-1' }), { schemaVersion: 1, encryptedAtRest: false });
	});

	it('preserves the existing limit values and states body units explicitly', () => {
		assert.deepEqual(E2EE_SEARCH_LIMITS, {
			defaultResults: 50,
			maxResults: 100,
			maxQueryTokens: 16,
			maxBatchDocuments: 500,
			maxDocumentBodyCodeUnits: 65_536,
			maxBatchBodyCodeUnits: 2_097_152,
		});
		assert.equal(Object.isFrozen(E2EE_SEARCH_LIMITS), true);
	});

	it('carries a timestamp and ID in the continuation request', () => {
		assert.deepEqual(recentQuery.cursor, { ts: 1000, id: 'message-100' });
		assert.deepEqual(capabilities, { recentCursor: 1, lifecycleEvents: 1, close: 1 });
	});
});
