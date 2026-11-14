import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { IMessage } from '../../../src/definition/messages';
import type { IUser } from '../../../src/definition/users';
import { UserType } from '../../../src/definition/users';
import { ModifyDeleter } from '../../../src/server/accessors/ModifyDeleter';
import type { AppBridges, MessageBridge, RoomBridge, UserBridge } from '../../../src/server/bridges';
import { TestData } from '../../test-data/utilities';

describe('ModifyDeleter', () => {
	let mockAppId: string;
	let mockRoomBridge: RoomBridge;
	let mockMessageBridge: MessageBridge;
	let mockUserBridge: UserBridge;
	let mockBridges: AppBridges;

	beforeEach(() => {
		mockAppId = 'testing-app';

		mockRoomBridge = {
			doDelete(roomId: string, appId: string): Promise<void> {
				return Promise.resolve();
			},
			doRemoveUsers(roomId: string, usernames: Array<string>, appId: string): Promise<void> {
				return Promise.resolve();
			},
		} as RoomBridge;

		mockMessageBridge = {
			doDelete(message: IMessage, user: IUser, appId: string): Promise<void> {
				return Promise.resolve();
			},
		} as MessageBridge;

		mockUserBridge = {
			doDeleteUsersCreatedByApp(appId: string, userType: UserType): Promise<boolean> {
				return Promise.resolve(true);
			},
		} as UserBridge;

		const rmBridge = mockRoomBridge;
		const msgBridge = mockMessageBridge;
		const usrBridge = mockUserBridge;
		mockBridges = {
			getRoomBridge: () => rmBridge,
			getMessageBridge: () => msgBridge,
			getUserBridge: () => usrBridge,
		} as AppBridges;
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('deleteRoom delegates to RoomBridge', async () => {
		const md = new ModifyDeleter(mockBridges, mockAppId);
		const spy = mock.method(mockRoomBridge, 'doDelete');

		await md.deleteRoom('room-id');

		assert.strictEqual(spy.mock.calls.length, 1);
		assert.deepStrictEqual(spy.mock.calls[0].arguments, ['room-id', mockAppId]);
	});

	it('deleteMessage delegates to MessageBridge', async () => {
		const md = new ModifyDeleter(mockBridges, mockAppId);
		const spy = mock.method(mockMessageBridge, 'doDelete');

		const message = TestData.getMessage();
		const user = TestData.getUser();
		await md.deleteMessage(message, user);

		assert.strictEqual(spy.mock.calls.length, 1);
		assert.deepStrictEqual(spy.mock.calls[0].arguments, [message, user, mockAppId]);
	});

	it('deleteUsers delegates to UserBridge and returns result', async () => {
		const md = new ModifyDeleter(mockBridges, mockAppId);
		const spy = mock.method(mockUserBridge, 'doDeleteUsersCreatedByApp');

		const result = await md.deleteUsers('app-id', UserType.APP);

		assert.strictEqual(result, true);
		assert.strictEqual(spy.mock.calls.length, 1);
		assert.deepStrictEqual(spy.mock.calls[0].arguments, ['app-id', UserType.APP]);

		await md.deleteUsers('app-id', UserType.BOT);
		assert.strictEqual(spy.mock.calls.length, 2);
		assert.deepStrictEqual(spy.mock.calls[1].arguments, ['app-id', UserType.BOT]);
	});

	it('removeUsersFromRoom delegates to RoomBridge', async () => {
		const md = new ModifyDeleter(mockBridges, mockAppId);
		const spy = mock.method(mockRoomBridge, 'doRemoveUsers');

		const usernames = ['user1', 'user2', 'user3'];
		await md.removeUsersFromRoom('room-id', usernames);

		assert.strictEqual(spy.mock.calls.length, 1);
		assert.deepStrictEqual(spy.mock.calls[0].arguments, ['room-id', usernames, mockAppId]);
	});

	it('removeUsersFromRoom accepts exactly 50 users', async () => {
		const md = new ModifyDeleter(mockBridges, mockAppId);
		const spy = mock.method(mockRoomBridge, 'doRemoveUsers');

		const fiftyUsers = Array.from({ length: 50 }, (_, i) => `user${i}`);
		await md.removeUsersFromRoom('room-id', fiftyUsers);

		assert.strictEqual(spy.mock.calls.length, 1);
		assert.deepStrictEqual(spy.mock.calls[0].arguments, ['room-id', fiftyUsers, mockAppId]);
	});

	it('removeUsersFromRoom throws when exceeding 50 users', async () => {
		const md = new ModifyDeleter(mockBridges, mockAppId);
		const spy = mock.method(mockRoomBridge, 'doRemoveUsers');

		const tooManyUsers = Array.from({ length: 51 }, (_, i) => `user${i}`);

		await assert.rejects(
			() => md.removeUsersFromRoom('room-id', tooManyUsers),
			{ name: 'Error', message: 'A maximum of 50 members can be removed in a single call' },
		);
		assert.strictEqual(spy.mock.calls.length, 0);
	});
});
