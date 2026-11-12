import { after, before, describe, it } from 'node:test';

import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import type { Response } from 'supertest';

import { api, credentials, getCredentials, request } from '../../data/api-data';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { adminUsername } from '../../data/user';
import { URL_MONGODB } from '../../e2e/config/constants';

describe('[chat.syncMessages] equal timestamp pagination', () => {
	let connection: MongoClient;
	let room: IRoom;
	let boundary: number;
	let ids: string[];

	before((_t, done) => getCredentials(done));
	before(async () => {
		connection = await MongoClient.connect(URL_MONGODB);
		room = (await createRoom({ type: 'c', name: `sync-timestamps-${Date.now()}` })).body.channel;
		// Remove automatic room messages so backward traversal contains only this fixture.
		await connection.db().collection('rocketchat_message').deleteMany({ rid: room._id });
		boundary = Date.now() + 60_000;
		const messages: IMessage[] = Array.from({ length: 431 }, (_, index) => ({
			_id: `${room._id}-${index}`,
			rid: room._id,
			msg: `Message ${index}`,
			u: { _id: credentials['X-User-Id'], username: adminUsername },
			ts: new Date(boundary),
			_updatedAt: new Date(boundary),
		}));
		messages[0]._updatedAt = new Date(boundary - 1);
		messages[430]._updatedAt = new Date(boundary + 1);
		ids = messages.map(({ _id }) => _id);
		await connection.db().collection<IMessage>('rocketchat_message').insertMany(messages);
		await connection
			.db()
			.collection<IMessage & { __collection__: string; _deletedAt: Date }>('rocketchat__trash')
			.insertMany(
				messages.map((message, index) => ({
					...message,
					__collection__: 'message',
					_deletedAt: message._updatedAt,
					// Deletion order must not depend on the message's original update order.
					_updatedAt: new Date(boundary - index),
				})),
			);
	});

	after(async () => {
		try {
			if (room) {
				await deleteRoom({ type: 'c', roomId: room._id });
				await connection.db().collection('rocketchat__trash').deleteMany({ rid: room._id });
			}
		} finally {
			await connection?.close();
		}
	});

	(['UPDATED', 'DELETED'] as const).forEach((type) => {
		(['next', 'previous'] as const).forEach((direction) => {
			it(`returns every ${type} message when paging ${direction} through 429 equal timestamps`, async () => {
				let cursor: string | null = `${boundary + (direction === 'next' ? -2 : 2)}`;
				const seen: string[] = [];
				let pages = 0;
				while (cursor !== null) {
					expect(pages++).to.be.lessThan(10);
					const response: Response = await request
						.get(api('chat.syncMessages'))
						.set(credentials)
						.query({ roomId: room._id, type, count: 50, [direction]: cursor })
						.expect(200);
					const { result } = response.body;
					const messages: { _id: string }[] = result[type === 'UPDATED' ? 'updated' : 'deleted'];
					seen.push(...messages.map(({ _id }) => _id));
					if (pages === 1) {
						expect(messages).to.have.lengthOf(50);
						expect(result.cursor[direction]).to.match(/^\d+_.+$/);
					}
					cursor = result.cursor[direction];
				}
				expect(pages).to.equal(9);
				expect(seen).to.have.lengthOf(ids.length);
				expect(new Set(seen).size).to.equal(ids.length);
				expect(seen).to.have.members(ids);
			});
		});
	});
});
