import { Subscriptions } from '@rocket.chat/models';

import { getSubscriptions } from './index';

jest.mock('@rocket.chat/models', () => ({
	Subscriptions: { findByUserId: jest.fn(), findDeletedAfterByUserId: jest.fn() },
}));
jest.mock('meteor/meteor', () => ({ Meteor: { methods: jest.fn() } }), { virtual: true });
jest.mock('../../../lib/publishFields', () => ({ subscriptionFields: { _id: 1, rid: 1, _updatedAt: 1 } }));

describe('getSubscriptions', () => {
	beforeEach(() => {
		jest
			.mocked(Subscriptions.findByUserId)
			.mockReset()
			.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) } as never);
		jest
			.mocked(Subscriptions.findDeletedAfterByUserId)
			.mockReset()
			.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) } as never);
	});

	it('preserves full subscription responses without a sync date', async () => {
		await expect(getSubscriptions('user-a')).resolves.toEqual([]);
		expect(Subscriptions.findDeletedAfterByUserId).not.toHaveBeenCalled();
	});

	it('includes room IDs in removal records for offline synchronization', async () => {
		const updatedAt = new Date('2026-01-01T00:00:00.000Z');
		const removed = { _id: 'subscription-a', rid: 'room-a', _deletedAt: new Date('2026-01-02T00:00:00.000Z') };
		jest.mocked(Subscriptions.findDeletedAfterByUserId).mockReturnValue({ toArray: jest.fn().mockResolvedValue([removed]) } as never);

		await expect(getSubscriptions('user-a', updatedAt)).resolves.toEqual({ update: [], remove: [removed] });
		expect(Subscriptions.findDeletedAfterByUserId).toHaveBeenCalledWith('user-a', updatedAt, {
			projection: { _id: 1, rid: 1, _deletedAt: 1 },
		});
	});
});
