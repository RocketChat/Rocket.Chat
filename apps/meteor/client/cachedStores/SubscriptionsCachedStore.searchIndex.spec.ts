import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { SubscriptionsCachedStore } from './SubscriptionsCachedStore';
import { subscriptionRemovals } from '../lib/e2eeSearch/subscriptionRemovals';

jest.mock('../lib/cachedStores/CachedStore', () => ({
	PrivateCachedStore: class {},
}));
jest.mock('../stores', () => ({ Rooms: {}, Subscriptions: { use: jest.fn() } }));

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
});
