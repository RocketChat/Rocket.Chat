import type { Collection, Db, FindOptions } from 'mongodb';

import { MessagesRaw } from './Messages';

jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
}));

const trashFind = jest.fn();

const createMessages = (): MessagesRaw =>
	new MessagesRaw(
		{ collection: () => ({ createIndexes: () => Promise.resolve([]) }) } as unknown as Db,
		{ find: trashFind } as unknown as Collection<any>,
	);

describe('message deleted lookups', () => {
	beforeEach(() => trashFind.mockReset().mockReturnValue({}));

	it('finds deleted messages in a room after a timestamp with the optional minimum message timestamp', () => {
		const options = { projection: { _id: 1, _deletedAt: 1 }, sort: { ts: -1 } } as FindOptions<any>;
		const deletedAt = new Date('2024-01-02T00:00:00.000Z');
		const minTs = new Date('2024-01-01T00:00:00.000Z');

		createMessages().findDeletedByRoomIdAfter('roomId', deletedAt, minTs, options);

		expect(trashFind).toHaveBeenCalledWith(
			{
				__collection__: 'message',
				_deletedAt: { $gt: deletedAt },
				rid: 'roomId',
				ts: { $gte: minTs },
			},
			options,
		);
	});

	it('finds deleted messages without a minimum message timestamp', () => {
		const options = { projection: { _id: 1, _deletedAt: 1 } } as FindOptions<any>;
		const deletedAt = new Date('2024-01-02T00:00:00.000Z');

		createMessages().findDeletedByRoomIdAfter('roomId', deletedAt, undefined, options);

		expect(trashFind).toHaveBeenCalledWith({ __collection__: 'message', _deletedAt: { $gt: deletedAt }, rid: 'roomId' }, options);
	});

	it.each(['$gt', '$lt'] as const)('finds deleted messages using a %s timestamp-only cursor', (direction) => {
		const options = { projection: { _id: 1, _deletedAt: 1 }, limit: 11 } as FindOptions<any>;
		const boundary = new Date('2024-01-02T00:00:00.000Z');
		const deletedAt = direction === '$gt' ? { $gt: boundary } : { $lt: boundary };

		createMessages().findDeletedByRoomIdAndDeletedAt('roomId', deletedAt, options);

		expect(trashFind).toHaveBeenCalledWith({ __collection__: 'message', rid: 'roomId', _deletedAt: deletedAt }, options);
	});

	it.each([
		['$gt', 'abc'],
		['$lt', 'abc'],
		['$gt', ''],
		['$lt', ''],
	] as const)('finds deleted messages using a %s timestamp cursor and ID tie-breaker "%s"', (direction, idTieBreaker) => {
		const order = direction === '$gt' ? 1 : -1;
		const options = { projection: { _id: 1, _deletedAt: 1 }, sort: { _deletedAt: order, _id: order }, limit: 11 } as FindOptions<any>;
		const boundary = new Date('2024-01-02T00:00:00.000Z');
		const deletedAt = direction === '$gt' ? { $gt: boundary } : { $lt: boundary };

		createMessages().findDeletedByRoomIdAndDeletedAt('roomId', deletedAt, options, idTieBreaker);

		expect(trashFind).toHaveBeenCalledWith(
			{
				__collection__: 'message',
				rid: 'roomId',
				$or: [{ _deletedAt: deletedAt }, { _deletedAt: boundary, _id: { [direction]: idTieBreaker } }],
			},
			options,
		);
	});
});
