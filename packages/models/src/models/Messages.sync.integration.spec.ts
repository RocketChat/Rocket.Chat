import type { IMessage, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { MongoClient } from 'mongodb';

import { MessagesRaw } from './Messages';
import { handleCursorPagination } from '../../../../apps/meteor/server/publications/messages';

jest.mock('../index', () => ({ getCollectionName: (name: string) => name, UpdaterImpl: class {} }));
jest.mock('./setUpdatedAt', () => ({ setUpdatedAt: jest.fn() }));
jest.mock('@rocket.chat/core-services', () => ({ ClientSafeError: Error }));
jest.mock('@rocket.chat/models', () => ({
	Messages: { findForUpdates: jest.fn(), findDeletedByRoomIdAndDeletedAt: jest.fn() },
}));
jest.mock('../../../../apps/meteor/server/lib/authorization/canAccessRoom', () => ({}));
jest.mock('../../../../apps/meteor/server/meteor-methods/messages/getChannelHistory', () => ({}));

const describeWithMongo = process.env.MODEL_TEST_MONGO_URL ? describe : describe.skip;

describeWithMongo('hidden deletion and compound cursor integration', () => {
	it('visits timestamp ties once in both directions without exposing hidden content', async () => {
		const client = await MongoClient.connect(process.env.MODEL_TEST_MONGO_URL!);
		const db = client.db(`sync_integration_${process.pid}_${Date.now()}`);
		try {
			const trash = db.collection<RocketChatRecordDeleted<IMessage>>('trash');
			const model = new MessagesRaw(db, trash);
			jest.mocked(Messages.findForUpdates).mockImplementation(model.findForUpdates.bind(model));
			jest.mocked(Messages.findDeletedByRoomIdAndDeletedAt).mockImplementation(model.findDeletedByRoomIdAndDeletedAt.bind(model));
			const ts = new Date('2026-10-28T00:00:00.000Z');
			const _updatedAt = new Date('2026-10-29T00:00:00.000Z');
			const records = Array.from({ length: 205 }, (_, index) => ({
				_id: `message-${String(index).padStart(3, '0')}`,
				rid: 'room-a',
				ts,
				_updatedAt,
				u: { _id: 'user-a', username: 'alice' },
				msg: index % 2 ? 'visible' : 'hidden-canary',
				...(index % 2 === 0 && { _hidden: true }),
			}));
			await model.insertMany([
				...records,
				{ ...records[0], _id: 'history', parent: records[0]._id },
				{ ...records[0], _id: 'other-room', rid: 'room-b' },
			] as IMessage[]);

			await trash.insertMany(
				records.map((record, index) => ({
					...record,
					_updatedAt: new Date(ts.getTime() + (records.length - index) * 1000),
					_deletedAt: _updatedAt,
					__collection__: 'message',
				})),
			);

			for (const type of ['UPDATED', 'DELETED'] as const) {
				for (const direction of ['next', 'previous'] as const) {
					const ids: string[] = [];
					let cursor: string | null = direction === 'next' ? '0_' : `${_updatedAt.getTime() + 1}_`;
					for (let page = 0; cursor !== null && page < 10; page++) {
						const result = await handleCursorPagination(
							type,
							'room-a',
							100,
							direction === 'next' ? cursor : undefined,
							direction === 'previous' ? cursor : undefined,
						);
						const pageMessages = type === 'UPDATED' ? result.updated : result.deleted;
						ids.push(...pageMessages.map(({ _id }) => _id));
						expect(JSON.stringify(pageMessages)).not.toContain('canary');
						for (const message of result.updated.filter(({ _hidden }) => _hidden)) {
							expect(message).toMatchObject({ t: 'rm', msg: '', _hidden: true, _updatedAt });
						}
						cursor = result.cursor![direction];
					}
					expect(cursor).toBeNull();
					const expectedIds = records.map(({ _id }) => _id);
					expect(ids).toEqual(direction === 'next' ? expectedIds : expectedIds.reverse());
					expect(new Set(ids).size).toBe(205);
				}
			}
		} finally {
			await db.dropDatabase();
			await client.close();
		}
	});
});
