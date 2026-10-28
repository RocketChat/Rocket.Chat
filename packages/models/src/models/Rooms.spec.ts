import type { Db } from 'mongodb';

import { RoomsRaw } from './Rooms';

// `Rooms` imports `..`, whose barrel pulls in every model and cycles back here.
jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
}));

const updateOne = jest.fn();
const db = { collection: () => ({ updateOne, createIndexes: jest.fn().mockResolvedValue(undefined) }) } as unknown as Db;

describe('addUserIdsToE2EEQueueByRoomId', () => {
	const model = new RoomsRaw(db);

	beforeEach(() => updateOne.mockReset().mockResolvedValue({ modifiedCount: 1 }));

	it('should push every user to the E2EE queue of the encrypted room in one update', async () => {
		await model.addUserIdsToE2EEQueueByRoomId('rid', ['u1', 'u2']);

		const [query, update] = updateOne.mock.calls[0];
		expect(query).toEqual({ _id: 'rid', encrypted: true });
		expect(update.$push.usersWaitingForE2EKeys.$slice).toBe(-50);
		expect(update.$push.usersWaitingForE2EKeys.$each).toEqual([
			{ userId: 'u1', ts: expect.any(Date) },
			{ userId: 'u2', ts: expect.any(Date) },
		]);
	});
});
