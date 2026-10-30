import type { IRoom } from '@rocket.chat/core-typings';
import type { E2EESearchOpenResult } from '@rocket.chat/desktop-api';

import { createTestSearchBackend } from './testSearchBackend';
import type { SearchIndexProgress } from '../../../../../lib/e2eeSearch/searchIndexScheduler';
import type { SearchIndexSessionStatus } from '../../../../../lib/e2eeSearch/searchIndexSession';

export type PreviewMode = 'indexing' | 'memory' | 'empty' | 'opening' | 'locked' | 'unavailable' | 'query-error' | 'legacy';
let mode: PreviewMode = 'indexing';
export const evidence = {
	openResultReads: 0,
	localQueries: 0,
	serverQueries: 0,
	catchUps: [] as string[],
	roomJumps: [] as string[],
	threadRoutes: [] as unknown[],
};
const backend = createTestSearchBackend();
const searchRecentPage = backend.searchRecentPage!;
backend.searchRecentPage = (query) => {
	evidence.localQueries++;
	if (mode === 'query-error') return Promise.reject(new Error('Local preview query failed'));
	if (mode === 'empty') return Promise.resolve({ hits: [] });
	return searchRecentPage(query);
};
const opened: E2EESearchOpenResult = {
	schemaVersion: 1,
	encryptedAtRest: true,
	capabilities: { recentCursor: 1, lifecycleEvents: 1, close: 1 },
};
const memoryOpened = { ...opened, encryptedAtRest: false };
const legacyOpened: E2EESearchOpenResult = { schemaVersion: 1, encryptedAtRest: true };
const lockedOpened: E2EESearchOpenResult = { ...legacyOpened, locked: true };
const progress: SearchIndexProgress = { status: 'indexing', rooms: 40, roomsDone: 12, roomsSkipped: 0, indexed: 300, pendingDecrypt: 0 };
const subscribe = () => () => undefined;

export const e2eSearchIndexSession = {
	subscribe,
	getActiveBackend: () => (['legacy', 'opening', 'locked', 'unavailable'].includes(mode) ? undefined : backend),
	getStatus: (): SearchIndexSessionStatus => {
		if (mode === 'legacy') return 'unsupported';
		if (mode === 'opening' || mode === 'locked' || mode === 'unavailable') return mode;
		return 'ready';
	},
	getOpenResult: () => {
		evidence.openResultReads++;
		if (mode === 'legacy') return legacyOpened;
		if (mode === 'locked') return lockedOpened;
		if (mode === 'opening' || mode === 'unavailable') return undefined;
		return mode === 'memory' ? memoryOpened : opened;
	},
};
export const e2eSearchIndexWriter = { subscribe, getVersion: () => 0 };
export const e2eSearchIndexRuntime = {
	subscribe,
	getProgress: () => (mode === 'indexing' || mode === 'memory' ? progress : undefined),
	requestRoomCatchUp: (rid: string) => evidence.catchUps.push(rid),
};
export const getSearchIndexBackend = () => (mode === 'legacy' ? undefined : backend);
export const absoluteUrl = () => `${window.location.origin}/`;
export const useRoom = () => ({ _id: 'room', t: 'p', name: 'encrypted-room', encrypted: true }) as IRoom;
export const useRoomSubscription = () => undefined;
export const getRoomTypeTranslation = () => 'Private group';
export const setMessageJumpQueryStringParameter = async (id: string) => {
	evidence.roomJumps.push(id);
};
export const setPreviewMode = (next: PreviewMode) => {
	mode = next;
};

export const preparePreview = () =>
	backend.upsert([
		{
			id: 'message',
			rid: 'room',
			uid: 'alice',
			username: 'alice',
			ts: Date.UTC(2026, 9, 26, 12),
			updatedAt: 1,
			kind: 'text',
			body: 'The needle is here.',
		},
		{
			id: 'file',
			rid: 'room',
			uid: 'bob',
			username: 'bob',
			ts: Date.UTC(2026, 9, 26, 10),
			updatedAt: 1,
			kind: 'file',
			body: 'The needle budget draft\nbudget-2026.pdf',
		},
		{
			id: 'reply',
			rid: 'room',
			tmid: 'thread',
			uid: 'carol',
			username: 'carol',
			ts: Date.UTC(2026, 9, 25, 12),
			updatedAt: 1,
			kind: 'text',
			body: 'A thread needle reply.',
		},
	]);
