import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IMessage } from '../../../../src/definition/messages';
import type { IRoom } from '../../../../src/definition/rooms';
import type { IUser } from '../../../../src/definition/users';
import { MessageBuilder, Notifier } from '../../../../src/server/accessors';
import type { MessageBridge, UserBridge } from '../../../../src/server/bridges';
import { TestData } from '../../../test-data/utilities';

describe('Notifier', () => {
	it('useNotifier', async () => {
		const mockUserBridge = {} as UserBridge;
		const mockMsgBridge = {
			doNotifyUser(user: IUser, msg: IMessage, appId: string): Promise<void> {
				// TODO: Spy on these and ensure they're called with the right parameters
				return Promise.resolve();
			},
			doNotifyRoom(room: IRoom, msg: IMessage, appId: string): Promise<void> {
				return Promise.resolve();
			},
		} as MessageBridge;

		assert.doesNotThrow(() => new Notifier(mockUserBridge, mockMsgBridge, 'testing'));

		const noti = new Notifier(mockUserBridge, mockMsgBridge, 'testing');
		await assert.doesNotReject(() => noti.notifyRoom(TestData.getRoom(), TestData.getMessage()));
		await assert.doesNotReject(() => noti.notifyUser(TestData.getUser(), TestData.getMessage()));
		assert.ok(noti.getMessageBuilder() instanceof MessageBuilder);
	});
});
