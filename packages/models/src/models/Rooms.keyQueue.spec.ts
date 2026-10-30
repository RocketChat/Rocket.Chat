import { RoomsRaw } from './Rooms';

describe('RoomsRaw.findEncryptedByIdsWithE2eKeyIdAndUserNotQueued', () => {
	it('forwards the key-queue filter and find options', () => {
		const returnedCursor = {};
		const find = jest.fn().mockReturnValue(returnedCursor);
		const model = Object.create(RoomsRaw.prototype) as RoomsRaw;
		Object.defineProperty(model, 'find', { value: find });
		const roomIds = ['r1', 'r2'];
		const options = { projection: { _id: 1 as const, e2eKeyId: 1 as const } };

		const cursor = model.findEncryptedByIdsWithE2eKeyIdAndUserNotQueued(roomIds, 'uid', options);

		expect(cursor).toBe(returnedCursor);
		expect(find).toHaveBeenCalledWith(
			{
				'_id': { $in: roomIds },
				'encrypted': true,
				'e2eKeyId': { $exists: true },
				'usersWaitingForE2EKeys.userId': { $ne: 'uid' },
			},
			options,
		);
	});
});
