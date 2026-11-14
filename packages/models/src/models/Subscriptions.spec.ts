import type { ISubscription, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { Collection, Db, UpdateResult } from 'mongodb';

import { Rooms, Users } from '../index';
import { SubscriptionsRaw } from './Subscriptions';

jest.mock('../index', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
	Rooms: { incUsersCountByIds: jest.fn() },
	Users: { removeRoomByRoomIds: jest.fn() },
}));

const incUsersCountByIds = jest.mocked(Rooms.incUsersCountByIds);
const removeRoomByRoomIds = jest.mocked(Users.removeRoomByRoomIds);

describe('SubscriptionsRaw.removeByRoomIds', () => {
	const documents = [
		{ _id: 'subscription-one', rid: 'room-one' },
		{ _id: 'subscription-two', rid: 'room-two' },
		{ _id: 'subscription-three', rid: 'room-one' },
	] as unknown as ISubscription[];
	const find = jest.fn();
	const deleteMany = jest.fn();
	const trashUpdateOne = jest.fn().mockResolvedValue(undefined);
	const trashBulkWrite = jest.fn().mockResolvedValue(undefined);
	const trash = {
		updateOne: trashUpdateOne,
		bulkWrite: trashBulkWrite,
	} as unknown as Collection<RocketChatRecordDeleted<ISubscription>>;
	const collection = {
		createIndexes: jest.fn().mockResolvedValue(undefined),
		find,
		deleteMany,
	} as unknown as Collection<ISubscription>;
	const db = { collection: jest.fn(() => collection) } as unknown as Db;
	const updateResult: UpdateResult = {
		acknowledged: true,
		matchedCount: 0,
		modifiedCount: 0,
		upsertedCount: 0,
		upsertedId: null,
	};
	let model: SubscriptionsRaw;

	beforeEach(() => {
		find.mockReset().mockReturnValue(documents);
		deleteMany.mockReset().mockResolvedValue({ acknowledged: true, deletedCount: documents.length });
		trashUpdateOne.mockClear().mockResolvedValue(undefined);
		trashBulkWrite.mockClear().mockResolvedValue(undefined);
		incUsersCountByIds.mockReset().mockResolvedValue(updateResult);
		removeRoomByRoomIds.mockReset().mockResolvedValue(updateResult);
		model = new SubscriptionsRaw(db, trash);
	});

	it('decrements each room count by its removed subscription count and forwards onTrash', async () => {
		const onTrash = jest.fn();

		const result = await model.removeByRoomIds(['room-one', 'room-two'], { onTrash });

		expect(result.deletedCount).toBe(documents.length);
		expect(incUsersCountByIds).toHaveBeenNthCalledWith(1, ['room-one'], -2);
		expect(incUsersCountByIds).toHaveBeenNthCalledWith(2, ['room-two'], -1);
		expect(removeRoomByRoomIds).toHaveBeenCalledWith(['room-one', 'room-two']);
		expect(onTrash).toHaveBeenCalledTimes(documents.length);
		expect(onTrash).toHaveBeenNthCalledWith(1, documents[0]);
		expect(onTrash).toHaveBeenNthCalledWith(2, documents[1]);
		expect(onTrash).toHaveBeenNthCalledWith(3, documents[2]);
	});

	it('does not decrement room counts when there are no subscriptions', async () => {
		find.mockReturnValue([]);
		deleteMany.mockResolvedValue({ acknowledged: true, deletedCount: 0 });

		await model.removeByRoomIds(['room-one', 'room-two'], { onTrash: jest.fn() });

		expect(incUsersCountByIds).not.toHaveBeenCalled();
	});
});
