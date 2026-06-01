import * as assert from 'node:assert';
import { describe, it, mock } from 'node:test';

import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { MessageBuilder, Notifier } from '../../../src/server/accessors';
import type { MessageBridge, UserBridge } from '../../../src/server/bridges';
import { TestData } from '../../test-data/utilities';

describe('Notifier', () => {
	it('useNotifier', async () => {
		const mockUserBridge = {} as UserBridge;
		const mockMsgBridge = {
			doNotifyUser(user: IUser, msg: IMessage, appId: string): Promise<void> {
				return Promise.resolve();
			},
			doNotifyRoom(room: IRoom, msg: IMessage, appId: string): Promise<void> {
				return Promise.resolve();
			},
		} as MessageBridge;

		assert.doesNotThrow(() => new Notifier(mockUserBridge, mockMsgBridge, 'testing'));

		const noti = new Notifier(mockUserBridge, mockMsgBridge, 'testing');

		const doNotifyRoomSpy = mock.method(mockMsgBridge, 'doNotifyRoom');
		const doNotifyUserSpy = mock.method(mockMsgBridge, 'doNotifyUser');

		const room = TestData.getRoom();
		const user = TestData.getUser();
		const roomMsg = TestData.getMessage();
		const userMsg = TestData.getMessage();

		await assert.doesNotReject(() => noti.notifyRoom(room, roomMsg));
		assert.strictEqual(doNotifyRoomSpy.mock.calls.length, 1);
		assert.strictEqual(doNotifyRoomSpy.mock.calls[0].arguments[0], room);
		assert.strictEqual(doNotifyRoomSpy.mock.calls[0].arguments[1], roomMsg);
		assert.strictEqual(doNotifyRoomSpy.mock.calls[0].arguments[2], 'testing');

		await assert.doesNotReject(() => noti.notifyUser(user, userMsg));
		assert.strictEqual(doNotifyUserSpy.mock.calls.length, 1);
		assert.strictEqual(doNotifyUserSpy.mock.calls[0].arguments[0], user);
		assert.strictEqual(doNotifyUserSpy.mock.calls[0].arguments[1], userMsg);
		assert.strictEqual(doNotifyUserSpy.mock.calls[0].arguments[2], 'testing');

		assert.ok(noti.getMessageBuilder() instanceof MessageBuilder);
	});
});
