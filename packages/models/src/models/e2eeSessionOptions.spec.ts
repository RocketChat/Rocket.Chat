import type { ClientSession, Db } from 'mongodb';

import { RoomsRaw } from './Rooms';
import { SubscriptionsRaw } from './Subscriptions';

jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
}));

const db = { collection: () => ({ createIndexes: jest.fn().mockResolvedValue(undefined) }) } as unknown as Db;
const session = {} as ClientSession;
const writeResult = { acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0, upsertedId: null };

describe('E2EE model session options', () => {
	afterEach(() => jest.restoreAllMocks());

	it.each([undefined, { session }])('forwards subscription key options %p without changing the write', async (options) => {
		const model = new SubscriptionsRaw(db);
		const update = jest.spyOn(model, 'updateOne').mockResolvedValue(writeResult);

		await expect(model.setGroupE2EKey('sid', 'encrypted-key', options)).resolves.toBe(writeResult);

		expect(update).toHaveBeenCalledWith({ _id: 'sid' }, { $set: { E2EKey: 'encrypted-key' } }, options);
	});

	it.each([undefined, { session }])('forwards queue options %p to both writes without changing the result', async (options) => {
		const model = new RoomsRaw(db);
		const update = jest.spyOn(model, 'updateMany').mockResolvedValue(writeResult);

		await expect(model.removeUsersFromE2EEQueueByRoomId('rid', ['uid'], options)).resolves.toBe(writeResult);

		expect(update).toHaveBeenNthCalledWith(
			1,
			{ '_id': 'rid', 'usersWaitingForE2EKeys.userId': { $in: ['uid'] }, 'encrypted': true },
			{ $pull: { usersWaitingForE2EKeys: { userId: { $in: ['uid'] } } } },
			options,
		);
		expect(update).toHaveBeenNthCalledWith(
			2,
			{ '_id': 'rid', 'usersWaitingForE2EKeys.0': { $exists: false }, 'encrypted': true },
			{ $unset: { usersWaitingForE2EKeys: 1 } },
			options,
		);
	});

	it('forwards the room key ID session and preserves the conditional write', async () => {
		const model = new RoomsRaw(db);
		const update = jest.spyOn(model, 'findOneAndUpdate').mockResolvedValue(null);

		await model.setE2eKeyId('rid', 'kid', { session });

		expect(update).toHaveBeenCalledWith(
			{ _id: 'rid', e2eKeyId: { $exists: false } },
			{ $set: { e2eKeyId: 'kid' } },
			{ session, returnDocument: 'after' },
		);
	});

	it.each([1, 2])('propagates a failure of queue write %p', async (failedWrite) => {
		const model = new RoomsRaw(db);
		const failure = new Error('write failed');
		const update = jest.spyOn(model, 'updateMany').mockResolvedValue(writeResult);
		update.mockImplementationOnce(() => (failedWrite === 1 ? Promise.reject(failure) : Promise.resolve(writeResult)));
		if (failedWrite === 2) {
			update.mockRejectedValueOnce(failure);
		}

		await expect(model.removeUsersFromE2EEQueueByRoomId('rid', ['uid'], { session })).rejects.toBe(failure);
		expect(update).toHaveBeenCalledTimes(failedWrite);
	});
});
