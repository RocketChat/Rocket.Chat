import type { Collection, Db } from 'mongodb';

import { SubscriptionsRaw } from './Subscriptions';

jest.mock('../index', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
}));

const find = jest.fn();
const db = { collection: () => ({ createIndexes: jest.fn().mockResolvedValue(undefined) }) } as unknown as Db;
const trash = { find } as unknown as Collection;

describe('findDeletedAfterByUserId', () => {
	const model = new SubscriptionsRaw(db, trash);

	beforeEach(() => find.mockReset());

	it('keeps the user, collection, and deletion boundary in the model', () => {
		const deletedAt = new Date('2026-01-01T00:00:00.000Z');
		const cursor = {};
		find.mockReturnValue(cursor);
		const options = { projection: { _id: 1, _deletedAt: 1 } };

		expect(model.findDeletedAfterByUserId('user-a', deletedAt, options)).toBe(cursor);
		expect(find).toHaveBeenCalledTimes(1);
		expect(find).toHaveBeenCalledWith({ '__collection__': 'subscription', '_deletedAt': { $gt: deletedAt }, 'u._id': 'user-a' }, options);
	});
});
