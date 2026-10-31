import { Subscriptions } from '@rocket.chat/models';

import { getSubscriptions } from './index';

jest.mock('@rocket.chat/models', () => ({
	Subscriptions: { findByUserId: jest.fn(), findDeletedAfterByUserId: jest.fn() },
}));
jest.mock('meteor/meteor', () => ({ Meteor: { methods: jest.fn() } }), { virtual: true });
jest.mock('../../../lib/publishFields', () => ({ subscriptionFields: { _id: 1, rid: 1, _updatedAt: 1 } }));

describe('getSubscriptions', () => {
	const updatedAt = new Date('2026-01-01T00:00:00.000Z');
	const records = [
		{ _id: 'older', rid: 'room-older', _updatedAt: new Date(updatedAt.getTime() - 1), u: { _id: 'user-a' }, name: 'Older room' },
		{ _id: 'equal', rid: 'room-equal', _updatedAt: updatedAt, u: { _id: 'user-a' }, name: 'Equal room' },
		{ _id: 'newer', rid: 'room-newer', _updatedAt: new Date(updatedAt.getTime() + 1), u: { _id: 'user-a' }, name: 'Newer room' },
	];

	beforeEach(() => {
		jest
			.mocked(Subscriptions.findByUserId)
			.mockReset()
			.mockReturnValue({ toArray: jest.fn().mockResolvedValue(records) } as never);
		jest
			.mocked(Subscriptions.findDeletedAfterByUserId)
			.mockReset()
			.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) } as never);
	});

	it('preserves full subscription responses without a sync date', async () => {
		await expect(getSubscriptions('user-a')).resolves.toEqual(records);
		expect(Subscriptions.findByUserId).toHaveBeenCalledWith('user-a', { projection: { _id: 1, rid: 1, _updatedAt: 1 } });
		expect(Subscriptions.findDeletedAfterByUserId).not.toHaveBeenCalled();
	});

	it('returns only newer subscriptions and preserves room IDs in removal records', async () => {
		const removed = { _id: 'subscription-a', rid: 'room-a', _deletedAt: new Date('2026-01-02T00:00:00.000Z') };
		jest.mocked(Subscriptions.findDeletedAfterByUserId).mockReturnValue({ toArray: jest.fn().mockResolvedValue([removed]) } as never);

		await expect(getSubscriptions('user-a', updatedAt)).resolves.toEqual({ update: [records[2]], remove: [removed] });
		expect(Subscriptions.findByUserId).toHaveBeenCalledWith('user-a', { projection: { _id: 1, rid: 1, _updatedAt: 1 } });
		expect(Subscriptions.findDeletedAfterByUserId).toHaveBeenCalledWith('user-a', updatedAt, {
			projection: { _id: 1, rid: 1, _deletedAt: 1 },
		});
	});
});
