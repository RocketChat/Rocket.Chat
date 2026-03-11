import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { IMessage } from '../../../../src/definition/messages';
import type { IRoom } from '../../../../src/definition/rooms';
import { ModifyExtender } from '../../../../src/server/accessors';
import type { AppBridges, MessageBridge, RoomBridge } from '../../../../src/server/bridges';
import { TestData } from '../../../test-data/utilities';

describe('ModifyExtender', () => {
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

	it('useModifyExtender', async () => {
		assert.doesNotThrow(() => new ModifyExtender(mockAppBridge, mockAppId));

		const me = new ModifyExtender(mockAppBridge, mockAppId);

		const doGetByIdRoomSpy = mock.method(mockRoomBridge, 'doGetById');
		const doUpdateRoomSpy = mock.method(mockRoomBridge, 'doUpdate');
		const doGetByIdMsgSpy = mock.method(mockMessageBridge, 'doGetById');
		const doUpdateMsgSpy = mock.method(mockMessageBridge, 'doUpdate');

		assert.ok((await me.extendRoom('roomId', TestData.getUser())) !== undefined);
		assert.strictEqual(doGetByIdRoomSpy.mock.calls.length, 1);
		assert.deepStrictEqual(doGetByIdRoomSpy.mock.calls[0].arguments, ['roomId', mockAppId]);
		assert.ok((await me.extendMessage('msgId', TestData.getUser())) !== undefined);
		assert.strictEqual(doGetByIdMsgSpy.mock.calls.length, 1);
		assert.deepStrictEqual(doGetByIdMsgSpy.mock.calls[0].arguments, ['msgId', mockAppId]);

		assert.throws(() => me.finish({} as any), { name: 'Error', message: 'Invalid extender passed to the ModifyExtender.finish function.' });
		assert.strictEqual(await me.finish(await me.extendRoom('roomId', TestData.getUser())), undefined);
		assert.ok(doUpdateRoomSpy.mock.calls.length > 0);
		assert.strictEqual(await me.finish(await me.extendMessage('msgId', TestData.getUser())), undefined);
		assert.ok(doUpdateMsgSpy.mock.calls.length > 0);
	});
});
