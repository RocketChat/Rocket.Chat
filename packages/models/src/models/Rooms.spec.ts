import type { Db } from 'mongodb';

import { RoomsRaw } from './Rooms';

jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	Subscriptions: {},
	UpdaterImpl: class {},
}));

jest.mock('../index', () => ({
	getCollectionName: (name: string) => name,
	Subscriptions: {},
	UpdaterImpl: class {},
}));

describe('RoomsRaw', () => {
	const updateMany = jest.fn();
	const db = {
		collection: () => ({
			updateMany,
			createIndexes: jest.fn().mockResolvedValue(undefined),
		}),
	} as unknown as Db;

	const model = new RoomsRaw(db);

	beforeEach(() => {
		updateMany.mockReset();
	});

	describe('updateGroupDMsRemovingUsernamesByUsername', () => {
		it('should pull username and userId and decrement usersCount', async () => {
			updateMany.mockResolvedValue({ acknowledged: true, modifiedCount: 1 });

			await model.updateGroupDMsRemovingUsernamesByUsername('john.doe', 'user123');

			expect(updateMany).toHaveBeenCalledWith(
				{
					t: 'd',
					usernames: 'john.doe',
					usersCount: { $gt: 2 },
				},
				{
					$pull: {
						usernames: 'john.doe',
						uids: 'user123',
					},
					$inc: {
						usersCount: -1,
					},
					$set: {
						_updatedAt: expect.any(Date),
					},
				},
			);
		});
	});
});
