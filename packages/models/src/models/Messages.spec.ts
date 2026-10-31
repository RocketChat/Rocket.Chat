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

	it('should include visible messages and hidden messages that are not history copies', () => {
		model.findForUpdates('rid', { updatedAt: { $gt: boundary } });

		expect(find.mock.calls[0][0]).toEqual({
			rid: 'rid',
			$or: [{ _hidden: { $ne: true } }, { parent: { $exists: false } }],
			_updatedAt: { $gt: boundary },
		});
	});

	it('should combine visibility and the forward compound cursor predicates', () => {
		model.findForUpdates('rid', { updatedAt: { $gt: boundary }, idTieBreaker: 'abc' });

		expect(find.mock.calls[0][0]).toEqual({
			rid: 'rid',
			$or: [{ _hidden: { $ne: true } }, { parent: { $exists: false } }],
			$and: [{ $or: [{ _updatedAt: { $gt: boundary } }, { _updatedAt: boundary, _id: { $gt: 'abc' } }] }],
		});
	});

	it('should combine visibility and the backward compound cursor predicates', () => {
		model.findForUpdates('rid', { updatedAt: { $lt: boundary }, idTieBreaker: 'abc' });

		expect(find.mock.calls[0][0]).toEqual({
			rid: 'rid',
			$or: [{ _hidden: { $ne: true } }, { parent: { $exists: false } }],
			$and: [{ $or: [{ _updatedAt: { $lt: boundary } }, { _updatedAt: boundary, _id: { $lt: 'abc' } }] }],
		});
	});
});
