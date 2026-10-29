import type { Db } from 'mongodb';

import { MessagesRaw } from './Messages';

// `Messages` imports `BaseRaw`, which imports `..`, whose barrel pulls in every model and cycles back here.
jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
}));

const db = { collection: () => ({ createIndexes: jest.fn().mockResolvedValue(undefined) }) } as unknown as Db;

describe('addReplyByThreadId', () => {
	const model = new MessagesRaw(db);

	it('should count the reply, add its followers and only move the last reply time forward', async () => {
		const updateOne = jest.spyOn(model, 'updateOne').mockResolvedValue({} as never);
		const ts = new Date('2026-10-25T03:00:00.000Z');

		await model.addReplyByThreadId('parent', ['parentAuthor', 'author'], ts);

		expect(updateOne).toHaveBeenCalledWith(
			{ _id: 'parent' },
			{
				$addToSet: { replies: { $each: ['parentAuthor', 'author'] } },
				$max: { tlm: ts },
				$inc: { tcount: 1 },
			},
		);
	});
});
