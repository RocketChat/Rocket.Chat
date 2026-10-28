import type { Db } from 'mongodb';

import { MessagesRaw } from './Messages';

// `Messages` imports `..`, whose barrel pulls in every model and cycles back here.
jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
}));

const find = jest.fn();
const db = { collection: () => ({ find, createIndexes: jest.fn().mockResolvedValue(undefined) }) } as unknown as Db;

describe('findForUpdates', () => {
	const model = new MessagesRaw(db);
	const boundary = new Date('2024-01-01T00:00:00.000Z');

	beforeEach(() => find.mockReset().mockReturnValue({}));

	it('should filter on _updatedAt alone without an id tie-breaker', () => {
		model.findForUpdates('rid', { updatedAt: { $gt: boundary } });

		expect(find.mock.calls[0][0]).toEqual({ rid: 'rid', _hidden: { $ne: true }, _updatedAt: { $gt: boundary } });
	});

	it('should order messages inside the boundary timestamp by _id with an id tie-breaker', () => {
		model.findForUpdates('rid', { updatedAt: { $gt: boundary }, idTieBreaker: { $gt: 'abc' } });

		expect(find.mock.calls[0][0]).toEqual({
			rid: 'rid',
			_hidden: { $ne: true },
			$or: [{ _updatedAt: { $gt: boundary } }, { _updatedAt: boundary, _id: { $gt: 'abc' } }],
		});
	});

	it('should use the $lt boundary when paging backward', () => {
		model.findForUpdates('rid', { updatedAt: { $lt: boundary }, idTieBreaker: { $lt: 'abc' } });

		expect(find.mock.calls[0][0]).toEqual({
			rid: 'rid',
			_hidden: { $ne: true },
			$or: [{ _updatedAt: { $lt: boundary } }, { _updatedAt: boundary, _id: { $lt: 'abc' } }],
		});
	});
});
