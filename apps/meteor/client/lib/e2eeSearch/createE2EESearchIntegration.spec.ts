import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

import { createE2EESearchIntegration } from './createE2EESearchIntegration';
import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';
import { roomMessageDeletes } from './roomMessageDeletes';
import { createSearchIndexSyncTimeStore, setSearchIndexOptIn } from './searchIndexOptIn';
import { subscriptionRemovals } from './subscriptionRemovals';

const mockBackend = createFakeSearchIndexBackend();
const mockConnection = Object.assign(new Emitter(), { status: 'connected' });
const mockSubscriptions = new Map([['s', { rid: 'r', encrypted: true }]]);
const mockSettings = new Map<string, unknown>([['E2E_Enable_Local_Search', true]]);
jest.mock('./getSearchIndexBackend', () => ({ getSearchIndexBackend: () => mockBackend }));
jest.mock('../absoluteUrl', () => ({ absoluteUrl: () => 'https://chat.example/a/' }));
jest.mock('../baseURI', () => ({ baseURI: 'https://chat.example/a/' }));
jest.mock('../RestApiClient', () => ({ APIClient: { getCredentials: jest.fn() } }));
jest.mock('../sdk/ddpSdk', () => ({ getDdpSdk: () => ({ connection: mockConnection }) }));
jest.mock('../settings', () => ({ settings: { peek: (key: string) => mockSettings.get(key) } }));
jest.mock('../../cachedStores/SubscriptionsCachedStore', () => ({
	SubscriptionsCachedStore: { useReady: { getState: () => true } },
}));
jest.mock('../../stores', () => ({
	Messages: { state: { get: jest.fn() } },
	PublicSettings: { use: { subscribe: jest.fn() } },
	Subscriptions: {
		state: {
			get records() {
				return mockSubscriptions;
			},
			find: (predicate: (record: { rid: string }) => boolean) => [...mockSubscriptions.values()].find(predicate),
		},
	},
}));
jest.mock('./searchIndexRuntime', () => ({
	...jest.requireActual('./searchIndexRuntime'),
	createSyncMessagesFetcher: () => jest.fn(async () => ({ updated: [], deleted: [] })),
}));

it('connects scoped consent, writes, stream deletes, room removal, and logout retention', async () => {
	window.localStorage.clear();
	setSearchIndexOptIn('https://chat.example/a/', 'u', true);
	const keys = await crypto.subtle.generateKey(
		{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
		true,
		['encrypt', 'decrypt'],
	);
	let userId = 'u';
	const source = Object.assign(new Emitter(), {
		getUserId: () => userId,
		privateKey: keys.privateKey,
		decryptMessage: jest.fn(async (message: IMessage) => message),
	});
	const error = jest.fn();
	const integration = createE2EESearchIntegration(source, { error, warn: jest.fn() });
	const message = (id: string): IMessage => ({
		_id: id,
		rid: 'r',
		t: 'e2e',
		e2e: 'done',
		msg: 'search words',
		u: { _id: 'u', username: 'alice' },
		ts: new Date(),
		_updatedAt: new Date(),
	});
	try {
		source.emit('E2E_STATE_CHANGED', { prevState: 'LOADING', nextState: 'READY' });
		await integration.session.whenSettled();
		await integration.runtime.whenSettled();
		expect(integration.session.getActiveBackend()).toBeDefined();
		integration.writer.index(message('a'));
		integration.writer.index(message('b'));
		await integration.writer.flush({ throwOnError: true });
		expect((await mockBackend.stats()).docs).toBe(2);

		roomMessageDeletes.emit('deleteMessage', { _id: 'a' });
		await integration.writer.flush({ throwOnError: true });
		expect((await mockBackend.search({ text: 'search' })).map(({ id }) => id)).toEqual(['b']);

		createSearchIndexSyncTimeStore('https://chat.example/a/', () => 'u').write(Date.now());
		userId = '';
		source.emit('E2E_STATE_CHANGED', { prevState: 'READY', nextState: 'NOT_STARTED' });
		await integration.session.whenSettled();
		await integration.runtime.whenSettled();
		expect(integration.session.getActiveBackend()).toBeUndefined();
		userId = 'u';
		source.emit('E2E_STATE_CHANGED', { prevState: 'NOT_STARTED', nextState: 'READY' });
		await integration.session.whenSettled();
		await integration.runtime.whenSettled();
		expect((await mockBackend.stats()).docs).toBe(1);

		await mockBackend.setRoomState('r', { backfillDone: true, lastUpdate: 1 });
		const removed = jest.spyOn(integration.runtime, 'onRoomRemoved');
		mockSubscriptions.clear();
		subscriptionRemovals.emit('removed', { rid: 'r' });
		expect(removed).toHaveBeenCalledTimes(1);
		expect(removed).toHaveBeenCalledWith('r');
		await removed.mock.results[0].value;
		expect((await mockBackend.stats()).docs).toBe(0);
		expect(await mockBackend.getRoomState('r')).toBeUndefined();
		expect(error).not.toHaveBeenCalled();
	} finally {
		integration.runtime.dispose();
		integration.writer.dispose();
		integration.session.dispose();
		await integration.session.whenSettled();
	}
});
