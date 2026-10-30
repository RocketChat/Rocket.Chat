import type { Db } from 'mongodb';

import { MessagesRaw } from './Messages';

jest.mock('../index', () => ({ getCollectionName: (name: string) => name, UpdaterImpl: class {} }));

const find = jest.fn();
const db = { collection: () => ({ find, createIndexes: jest.fn().mockResolvedValue(undefined) }) } as unknown as Db;

describe('findForUpdates', () => {
	it('includes original hidden messages but excludes hidden history clones', () => {
		const model = new MessagesRaw(db);
		const updatedAt = { $gt: new Date('2026-10-28T00:00:00.000Z') };
		const minTs = new Date('2026-10-01T00:00:00.000Z');
		const options = { sort: { _updatedAt: 1 as const }, limit: 3 };
		const cursor = {};
		find.mockReturnValue(cursor);

		expect(model.findForUpdates('room-a', { updatedAt, minTs }, options)).toBe(cursor);
		expect(find).toHaveBeenCalledWith(
			{
				rid: 'room-a',
				_updatedAt: updatedAt,
				ts: { $gte: minTs },
				$or: [{ _hidden: { $ne: true } }, { parent: { $exists: false } }],
			},
			options,
		);
	});
});
