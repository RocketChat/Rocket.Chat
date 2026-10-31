import type { ISubscription } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { SubscriptionsCachedStore } from './SubscriptionsCachedStore';
import { createFakeSearchIndexBackend } from '../lib/e2eeSearch/fakeSearchIndexBackend';
import { createSearchIndexRuntime } from '../lib/e2eeSearch/searchIndexRuntime';
import { subscriptionRemovals } from '../lib/e2eeSearch/subscriptionRemovals';
import { Subscriptions } from '../stores';

const mockStream = jest.fn((_event: unknown, _names: unknown, _callback: unknown) => ({ stop: jest.fn() }));
jest.mock('localforage', () => ({
	config: jest.fn(),
	getItem: jest.fn(async () => null),
	setItem: jest.fn(async () => undefined),
}));
jest.mock('../lib/SDKClient', () => ({
	sdk: { stream: (event: unknown, names: unknown, callback: unknown) => mockStream(event, names, callback) },
}));
jest.mock('../lib/user', () => ({ getUserId: () => 'u' }));
jest.mock('../lib/utils/getConfig', () => ({ getConfig: () => undefined }));
jest.mock('../lib/baseURI', () => ({ baseURI: 'https://chat.example' }));
jest.mock('../lib/loggedIn', () => ({ onLoggedIn: jest.fn() }));
jest.mock('../meteor/connection', () => ({ hasPendingMethods: () => false }));
jest.mock('../lib/sdk/ddpSdk', () => ({ getDdpSdk: () => ({ account: { onLogout: jest.fn() } }) }));
jest.mock('../stores', () => {
	const { createDocumentMapStore } = jest.requireActual('../lib/cachedStores/DocumentMapStore');
	return { Rooms: { use: createDocumentMapStore() }, Subscriptions: { use: createDocumentMapStore() } };
});

describe('subscription removal notifications', () => {
	it('publishes removed room IDs and ignores updates or legacy records without a room', () => {
		const listener = jest.fn();
		const off = subscriptionRemovals.on('removed', listener);
		const store = SubscriptionsCachedStore as unknown as {
			handleSyncEvent(action: 'removed' | 'changed', record: SubscriptionWithRoom): void;
		};
		try {
			store.handleSyncEvent('removed', { _id: 's', rid: 'r' } as SubscriptionWithRoom);
			store.handleSyncEvent('changed', { _id: 's', rid: 'r' } as SubscriptionWithRoom);
			store.handleSyncEvent('removed', { _id: 'legacy' } as SubscriptionWithRoom);
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith({ rid: 'r' });
		} finally {
			off();
		}
	});

	it('removes indexed documents and the checkpoint through the real subscriptions-changed callback', async () => {
		jest.useFakeTimers();
		const backend = createFakeSearchIndexBackend();
		await backend.open({ userId: 'u', wrapKey: new Uint8Array(32) });
		const writer = { flush: jest.fn(async () => undefined), remove: jest.fn(async () => undefined) };
		const runtime = createSearchIndexRuntime({
			session: { getActiveBackend: () => backend, subscribe: () => () => undefined },
			writer,
			syncMessages: async () => ({ updated: [], deleted: [] }),
			decryptMessage: async (message) => message,
			getRooms: () => [],
		});
		const removed = jest.spyOn(runtime, 'onRoomRemoved');
		const listener = jest.fn(({ rid }: { rid: string }) => {
			expect(Subscriptions.use.getState().records.has('s')).toBe(false);
			void runtime.onRoomRemoved(rid);
		});
		const off = subscriptionRemovals.on('removed', listener);
		const store = SubscriptionsCachedStore as unknown as {
			setupListener(): void;
			save: { cancel(): void };
		};
		try {
			await runtime.whenSettled();
			await backend.upsert([{ id: 'm', rid: 'r', uid: 'u', username: 'alice', ts: 1, updatedAt: 1, kind: 'text', body: 'secret' }]);
			await backend.setRoomState('r', { backfillDone: true, lastUpdate: 1 });
			store.setupListener();
			const [event, names, callback] = mockStream.mock.calls[0] as unknown as [
				string,
				string[],
				(action: 'changed' | 'removed', record: ISubscription) => Promise<void>,
			];
			expect(event).toBe('notify-user');
			expect(names).toEqual(['u/subscriptions-changed']);
			const subscription = { _id: 's', rid: 'r', name: 'room' } as ISubscription;
			await callback('changed', subscription);
			expect(listener).not.toHaveBeenCalled();
			expect(Subscriptions.use.getState().records.has('s')).toBe(true);
			await callback('removed', subscription);
			expect(listener).toHaveBeenCalledTimes(1);
			expect(removed).toHaveBeenCalledTimes(1);
			await removed.mock.results[0].value;
			expect((await backend.stats()).docs).toBe(0);
			expect(await backend.getRoomState('r')).toBeUndefined();
		} finally {
			off();
			runtime.dispose();
			store.save.cancel();
			jest.useRealTimers();
		}
	});
});
