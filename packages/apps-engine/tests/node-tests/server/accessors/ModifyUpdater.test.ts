import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { ILivechatRoom } from '../../../../src/definition/livechat/ILivechatRoom';
import type { IMessage } from '../../../../src/definition/messages';
import type { IRoom } from '../../../../src/definition/rooms';
import { RoomType } from '../../../../src/definition/rooms';
import { MessageBuilder, ModifyUpdater, RoomBuilder } from '../../../../src/server/accessors';
import type { AppBridges, MessageBridge, RoomBridge } from '../../../../src/server/bridges';
import { TestData } from '../../../test-data/utilities';

describe('ModifyUpdater', () => {
	let mockAppId: string;
	let mockRoomBridge: RoomBridge;
	let mockMessageBridge: MessageBridge;
	let mockAppBridge: AppBridges;

	beforeEach(() => {
		mockAppId = 'testing-app';

		mockRoomBridge = {
			doGetById(roomId: string, appId: string): Promise<IRoom> {
				return Promise.resolve(TestData.getRoom());
			},
			doUpdate(room: IRoom, members: Array<string>, appId: string): Promise<void> {
				return Promise.resolve();
			},
		} as RoomBridge;

		mockMessageBridge = {
			doGetById(msgId: string, appId: string): Promise<IMessage> {
				return Promise.resolve(TestData.getMessage());
			},
			doUpdate(msg: IMessage, appId: string): Promise<void> {
				return Promise.resolve();
			},
		} as MessageBridge;

		const rmBridge = mockRoomBridge;
		const msgBridge = mockMessageBridge;
		mockAppBridge = {
			getMessageBridge() {
				return msgBridge;
			},
			getRoomBridge() {
				return rmBridge;
			},
		} as AppBridges;
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('basicModifyUpdater', async () => {
		assert.doesNotThrow(() => new ModifyUpdater(mockAppBridge, mockAppId));

		const mc = new ModifyUpdater(mockAppBridge, mockAppId);
		assert.ok(mc.message('msgId', TestData.getUser()) !== undefined);
		assert.ok(mc.room('roomId', TestData.getUser()) !== undefined);

		assert.throws(() => mc.finish({} as any), {
			name: 'Error',
			message: 'Invalid builder passed to the ModifyUpdater.finish function.',
		});
	});

	it('msgModifyUpdater', async () => {
		const mc = new ModifyUpdater(mockAppBridge, mockAppId);

		const msg = {} as IMessage;
		const msgBd = new MessageBuilder(msg);
		assert.throws(() => mc.finish(msgBd), { name: 'Error', message: 'The "room" property is required.' });
		msgBd.setRoom(TestData.getRoom());
		assert.ok(msg.room !== undefined);
		assert.throws(() => mc.finish(msgBd), { name: 'Error', message: "Invalid message, can't update a message without an id." });
		msg.id = 'testing-msg';
		assert.throws(() => mc.finish(msgBd), { name: 'Error', message: 'Invalid sender assigned to the message.' });
		msgBd.setSender(TestData.getUser());
		assert.ok(msg.sender !== undefined);

		const msgBriSpy = mock.method(mockMessageBridge, 'doUpdate');
		assert.strictEqual(await mc.finish(msgBd), undefined);
		assert.strictEqual(msgBriSpy.mock.calls.length, 1);
		assert.deepStrictEqual(msgBriSpy.mock.calls[0].arguments, [msg, mockAppId]);
	});

	it('roomModifyUpdater', async () => {
		const mc = new ModifyUpdater(mockAppBridge, mockAppId);

		const room = {} as IRoom;
		const roomBd = new RoomBuilder(room);
		assert.throws(() => mc.finish(roomBd), { name: 'Error', message: 'Invalid room, can not update a room without an id.' });
		room.id = 'testing-room';

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

		const roomBriSpy = mock.method(mockRoomBridge, 'doUpdate');
		assert.strictEqual(await mc.finish(roomBd), undefined);
		assert.strictEqual(roomBriSpy.mock.calls.length, 1);
		assert.deepStrictEqual(roomBriSpy.mock.calls[0].arguments, [room, roomBd.getMembersToBeAddedUsernames(), mockAppId]);
	});

	it('livechatRoomModifyUpdater', async () => {
		const mc = new ModifyUpdater(mockAppBridge, mockAppId);

		const room = {} as ILivechatRoom;
		const roomBd = new RoomBuilder(room);
		assert.throws(() => mc.finish(roomBd), { name: 'Error', message: 'Invalid room, can not update a room without an id.' });
		room.id = 'testing-room';

		assert.throws(() => mc.finish(roomBd), { name: 'Error', message: 'Invalid type assigned to the room.' });
		roomBd.setType(RoomType.LIVE_CHAT);
		assert.strictEqual(room.type, RoomType.LIVE_CHAT);

		assert.throws(() => mc.finish(roomBd), { name: 'Error', message: 'Invalid displayName assigned to the room.' });
		roomBd.setDisplayName('Display Name');
		assert.strictEqual(room.displayName, 'Display Name');

		const roomBriSpy = mock.method(mockRoomBridge, 'doUpdate');
		assert.strictEqual(await mc.finish(roomBd), undefined);
		assert.strictEqual(roomBriSpy.mock.calls.length, 1);
		assert.deepStrictEqual(roomBriSpy.mock.calls[0].arguments, [room, roomBd.getMembersToBeAddedUsernames(), mockAppId]);
	});
});
