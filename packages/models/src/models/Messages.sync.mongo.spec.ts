import type { IMessage } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';

import { MessagesRaw } from './Messages';

jest.mock('../index', () => ({ getCollectionName: (name: string) => name, UpdaterImpl: class {} }));
jest.mock('./setUpdatedAt', () => ({ setUpdatedAt: jest.fn() }));

const describeWithMongo = process.env.MODEL_TEST_MONGO_URL ? describe : describe.skip;

describeWithMongo('message synchronization with MongoDB', () => {
	it('returns hidden originals without history copies or out-of-scope messages', async () => {
		const client = await MongoClient.connect(process.env.MODEL_TEST_MONGO_URL!);
		const db = client.db(`message_sync_${process.pid}_${Date.now()}`);
		try {
			const model = new MessagesRaw(db);
			const ts = new Date('2026-10-28T00:00:00.000Z');
			const _updatedAt = new Date('2026-10-29T00:00:00.000Z');
			const base = { rid: 'room-a', ts, _updatedAt, u: { _id: 'user-a', username: 'alice' }, msg: '' };
			await model.insertMany([
				{ ...base, _id: 'visible' },
				{ ...base, _id: 'hidden', _hidden: true },
				{ ...base, _id: 'history', _hidden: true, parent: 'hidden' },
				{ ...base, _id: 'other-room', rid: 'room-b', _hidden: true },
				{ ...base, _id: 'old-update', _updatedAt: ts, _hidden: true },
				{ ...base, _id: 'old-send', ts: new Date(0), _hidden: true },
			] as IMessage[]);

			const records = await model.findForUpdates('room-a', { updatedAt: { $gt: ts }, minTs: ts }, { sort: { _id: 1 } }).toArray();
			expect(records.map(({ _id }) => _id)).toEqual(['hidden', 'visible']);
		} finally {
			await db.dropDatabase();
			await client.close();
		}
	});
});
