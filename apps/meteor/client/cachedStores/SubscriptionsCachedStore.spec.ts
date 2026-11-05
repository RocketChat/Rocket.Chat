import { SubscriptionsCachedStore } from './SubscriptionsCachedStore';
import { createFakeRoom, createFakeSubscription } from '../../tests/mocks/data';
import { STORAGE_KEYS } from '../lib/sdk/storage';
import { Rooms, Subscriptions } from '../stores';

jest.mock('localforage', () => ({
	config: jest.fn(),
	getItem: jest.fn(),
	setItem: jest.fn().mockResolvedValue(undefined),
	removeItem: jest.fn().mockResolvedValue(undefined),
}));

describe('SubscriptionsCachedStore', () => {
	it('should restore a direct message from the cache with the members of its room', async () => {
		const { getItem } = jest.requireMock('localforage');
		const subscription = createFakeSubscription({ _id: 'subscription-id', rid: 'dm-id', t: 'd' });
		Rooms.use.getState().store(createFakeRoom({ _id: 'dm-id', t: 'd', uids: ['me', 'other'] }));
		localStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, 'token');
		getItem.mockResolvedValue({ version: Number.MAX_SAFE_INTEGER, token: 'token', records: [subscription], updatedAt: new Date() });

		await SubscriptionsCachedStore.init();

		expect(Subscriptions.use.getState().get('subscription-id')).toMatchObject({ uids: ['me', 'other'] });
	});
});
