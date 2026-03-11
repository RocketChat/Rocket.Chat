import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { IMessage } from '../../../../src/definition/messages';
import type { IRoom } from '../../../../src/definition/rooms';
import { RoomType } from '../../../../src/definition/rooms';
import type { IUser } from '../../../../src/definition/users';
import { UserStatusConnection, UserType } from '../../../../src/definition/users';
import { ModifyCreator } from '../../../../src/server/accessors';
import type { AppBridges, MessageBridge, RoomBridge, UserBridge } from '../../../../src/server/bridges';
import { TestData } from '../../../test-data/utilities';

describe('ModifyCreator', () => {
	let mockAppId: string;
	let mockRoomBridge: RoomBridge;
	let mockMessageBridge: MessageBridge;
	let mockAppBridge: AppBridges;
	let mockAppUser: IUser;
	let mockUserBridge: UserBridge;

	beforeEach(() => {
		mockAppId = 'testing-app';

		mockAppUser = {
			id: 'mockAppUser',
			isEnabled: true,
			name: 'mockAppUser',
			roles: ['app'],
			status: 'online',
			statusConnection: UserStatusConnection.UNDEFINED,
			type: UserType.APP,
			username: 'mockAppUser',
			emails: [],
			utcOffset: -5,
			createdAt: new Date(),
			updatedAt: new Date(),
			lastLoginAt: new Date(),
		};

		mockRoomBridge = {
			doCreate(room: IRoom, members: Array<string>, appId: string): Promise<string> {
				return Promise.resolve('roomId');
			},
		} as RoomBridge;

		mockMessageBridge = {
			doCreate(msg: IMessage, appId: string): Promise<string> {
				return Promise.resolve('msgId');
			},
		} as MessageBridge;

		const appUser = mockAppUser;
		mockUserBridge = {
			doGetAppUser: (appId: string) => {
				return Promise.resolve(appUser);
			},
		} as UserBridge;

		const msgBridge = mockMessageBridge;
		const rmBridge = mockRoomBridge;
		const userBridge = mockUserBridge;
		mockAppBridge = {
			getMessageBridge: () => msgBridge,
			getRoomBridge: () => rmBridge,
			getUserBridge: () => userBridge,
		} as AppBridges;
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('basicModifyCreator', async () => {
		assert.doesNotThrow(() => new ModifyCreator(mockAppBridge, mockAppId));

		const mc = new ModifyCreator(mockAppBridge, mockAppId);
		assert.ok(mc.startMessage() !== undefined);
		assert.ok(mc.startMessage({ id: 'value' } as IMessage) !== undefined);
		assert.ok(mc.startRoom() !== undefined);
		assert.ok(mc.startRoom({ id: 'value' } as IRoom) !== undefined);

		assert.throws(() => mc.finish({} as any), { name: 'Error', message: 'Invalid builder passed to the ModifyCreator.finish function.' });
	});

	it('msgModifyCreator', async () => {
		const mc = new ModifyCreator(mockAppBridge, mockAppId);

		const msg = {} as IMessage;
		const msgBd = mc.startMessage(msg);
		await assert.rejects(() => mc.finish(msgBd), { name: 'Error', message: 'The "room" property is required.' });
		msgBd.setRoom(TestData.getRoom());
		assert.ok(msg.room !== undefined);
		await assert.doesNotReject(() => mc.finish(msgBd));
		msgBd.setSender(TestData.getUser());
		assert.ok(msg.sender !== undefined);

		const msgBriSpy = mock.method(mockMessageBridge, 'doCreate');
		assert.strictEqual(await mc.finish(msgBd), 'msgId');
		assert.strictEqual(msgBriSpy.mock.calls.length, 1);
		assert.deepStrictEqual(msgBriSpy.mock.calls[0].arguments, [msg, mockAppId]);
	});

	it('roomModifyCreator', async () => {
		const mc = new ModifyCreator(mockAppBridge, mockAppId);

		const room = {} as IRoom;
		const roomBd = mc.startRoom(room);
		assert.throws(() => mc.finish(roomBd), { name: 'Error', message: 'Invalid type assigned to the room.' });
		roomBd.setType(RoomType.CHANNEL);
		assert.strictEqual(room.type, RoomType.CHANNEL);

		assert.throws(() => mc.finish(roomBd), { name: 'Error', message: 'Invalid creator assigned to the room.' });
		roomBd.setCreator(TestData.getUser());
		assert.ok(room.creator !== undefined);

		assert.throws(() => mc.finish(roomBd), { name: 'Error', message: 'Invalid slugifiedName assigned to the room.' });
		roomBd.setSlugifiedName('testing-room');
		assert.strictEqual(room.slugifiedName, 'testing-room');

		assert.throws(() => mc.finish(roomBd), { name: 'Error', message: 'Invalid displayName assigned to the room.' });
		roomBd.setDisplayName('Display Name');
		assert.strictEqual(room.displayName, 'Display Name');

		const roomBriSpy = mock.method(mockRoomBridge, 'doCreate');
		assert.strictEqual(await mc.finish(roomBd), 'roomId');
		assert.strictEqual(roomBriSpy.mock.calls.length, 1);
		assert.deepStrictEqual(roomBriSpy.mock.calls[0].arguments, [room, roomBd.getMembersToBeAddedUsernames(), mockAppId]);
	});
});
