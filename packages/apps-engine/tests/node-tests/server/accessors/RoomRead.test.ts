import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IMessageRaw } from '../../../../src/definition/messages';
import type { IRoom, IRoomRaw } from '../../../../src/definition/rooms';
import type { IUser } from '../../../../src/definition/users';
import { RoomRead } from '../../../../src/server/accessors';
import type { RoomBridge } from '../../../../src/server/bridges';
import { TestData } from '../../../test-data/utilities';

describe('RoomRead', () => {
	const room = TestData.getRoom();
	room.id = room.id || 'room-id';
	const user = TestData.getUser();
	const messages: IMessageRaw[] = ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea'].map((id) => TestData.getMessageRaw(id));
	const unreadRoomId = messages[0].roomId;
	const unreadUserId = messages[0].sender._id;

	const theRooms: IRoomRaw[] = [
		{
			id: room.id,
			slugifiedName: room.slugifiedName,
			displayName: room.displayName,
			type: room.type,
			creator: {
				_id: room.creator.id,
				username: room.creator.username,
				name: room.creator.name,
			},
		},
	];

	const mockRoomBridgeWithRoom = {
		doGetById(id: string, appId: string): Promise<IRoom> {
			return Promise.resolve(room);
		},
		doGetByName(name: string, appId: string): Promise<IRoom> {
			return Promise.resolve(room);
		},
		doGetCreatorById(id: string, appId: string): Promise<IUser> {
			return Promise.resolve(user);
		},
		doGetCreatorByName(name: string, appId: string): Promise<IUser> {
			return Promise.resolve(user);
		},
		doGetDirectByUsernames(usernames: Array<string>, appId: string): Promise<IRoom> {
			return Promise.resolve(room);
		},
		doGetMembers(name: string, appId: string): Promise<Array<IUser>> {
			return Promise.resolve([user]);
		},
		doGetAllRooms(filter: any, appId: string): Promise<Array<IRoomRaw>> {
			return Promise.resolve(theRooms);
		},
		doGetMessages(roomId: string, options: any, appId: string): Promise<IMessageRaw[]> {
			return Promise.resolve(messages);
		},
		doGetUnreadByUser(roomId: string, uid: string, options: any, appId: string): Promise<IMessageRaw[]> {
			if (roomId === unreadRoomId && uid === unreadUserId) {
				return Promise.resolve(messages);
			}
			return Promise.resolve([]);
		},
	} as unknown as RoomBridge;

	it('expectDataFromRoomRead', async () => {
		assert.doesNotThrow(() => new RoomRead(mockRoomBridgeWithRoom, 'testing-app'));

		const rr = new RoomRead(mockRoomBridgeWithRoom, 'testing-app');

		assert.ok((await rr.getById('fake')) !== undefined);
		assert.strictEqual(await rr.getById('fake'), room);
		assert.ok((await rr.getByName('testing-room')) !== undefined);
		assert.strictEqual(await rr.getByName('testing-room'), room);
		assert.ok((await rr.getCreatorUserById('testing')) !== undefined);
		assert.strictEqual(await rr.getCreatorUserById('testing'), user);
		assert.ok((await rr.getCreatorUserByName('testing')) !== undefined);
		assert.strictEqual(await rr.getCreatorUserByName('testing'), user);
		assert.ok((await rr.getDirectByUsernames([user.username])) !== undefined);
		assert.strictEqual(await rr.getDirectByUsernames([user.username]), room);
		assert.ok((await rr.getMessages('testing')) !== undefined);
		assert.strictEqual(await rr.getMessages('testing'), messages);
		assert.ok((await rr.getAllRooms()) !== undefined);
		assert.deepStrictEqual(await rr.getAllRooms(), [
			{
				id: room.id,
				slugifiedName: room.slugifiedName,
				displayName: room.displayName,
				type: room.type,
				creator: {
					_id: room.creator.id,
					username: room.creator.username,
					name: room.creator.name,
				},
			},
		]);
		assert.ok((await rr.getUnreadByUser(unreadRoomId, unreadUserId)) !== undefined);
		assert.deepStrictEqual(await rr.getUnreadByUser(unreadRoomId, unreadUserId), messages);

		assert.ok((await rr.getUnreadByUser('fake', 'fake')) !== undefined);
		assert.deepStrictEqual(await rr.getUnreadByUser('fake', 'fake'), []);
	});

	it('useTheIterators', async () => {
		assert.doesNotThrow(() => new RoomRead(mockRoomBridgeWithRoom, 'testing-app'));

		const rr = new RoomRead(mockRoomBridgeWithRoom, 'testing-app');

		assert.ok((await rr.getMembers('testing')) !== undefined);
		assert.ok((await rr.getMembers('testing') as Array<IUser>).length > 0);
		assert.strictEqual((await rr.getMembers('testing'))[0], user);
	});

	it('validateGetAllRoomsEdgeCases', async () => {
		const rr = new RoomRead(mockRoomBridgeWithRoom, 'testing-app');

		// Test negative limit
		await assert.rejects(async () => rr.getAllRooms({}, { limit: -1 }));
		await assert.rejects(async () => rr.getAllRooms({}, { limit: -100 }));

		// Test zero limit
		await assert.rejects(async () => rr.getAllRooms({}, { limit: 0 }));
		// Test non-finite limit values
		await assert.rejects(async () => rr.getAllRooms({}, { limit: NaN }));
		await assert.rejects(async () => rr.getAllRooms({}, { limit: Infinity }));
		await assert.rejects(async () => rr.getAllRooms({}, { limit: -Infinity }));

		// Test limit > 100 (existing test case)
		await assert.rejects(async () => rr.getAllRooms({}, { limit: 101 }));
		await assert.rejects(async () => rr.getAllRooms({}, { limit: 200 }));

		// Test negative skip values
		await assert.rejects(async () => rr.getAllRooms({}, { skip: -1 }));
		await assert.rejects(async () => rr.getAllRooms({}, { skip: -100 }));

		// Test non-finite skip values
		await assert.rejects(async () => rr.getAllRooms({}, { skip: NaN }));
		await assert.rejects(async () => rr.getAllRooms({}, { skip: Infinity }));
		await assert.rejects(async () => rr.getAllRooms({}, { skip: -Infinity }));

		// Test valid calls to ensure validation doesn't break normal behavior
		await assert.doesNotReject(async () => rr.getAllRooms({}, { limit: 1 }));
		await assert.doesNotReject(async () => rr.getAllRooms({}, { limit: 50 }));
		await assert.doesNotReject(async () => rr.getAllRooms({}, { limit: 100 }));
		await assert.doesNotReject(async () => rr.getAllRooms({}, { skip: 0 }));
		await assert.doesNotReject(async () => rr.getAllRooms({}, { skip: 10 }));
		await assert.doesNotReject(async () => rr.getAllRooms({}, { limit: 50, skip: 10 }));
	});
});
