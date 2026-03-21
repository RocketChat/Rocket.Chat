import { AsyncTest, Expect, SetupFixture, SpyOn } from 'alsatian';

import type { IMessage } from '../../../src/definition/messages';
import type { IUser } from '../../../src/definition/users';
import { UserType } from '../../../src/definition/users';
import { ModifyDeleter } from '../../../src/server/accessors/ModifyDeleter';
import type { AppBridges, MessageBridge, RoomBridge, UserBridge } from '../../../src/server/bridges';
import { TestData } from '../../test-data/utilities';

export class ModifyDeleterAccessorTestFixture {
	private mockAppId: string;

	private mockRoomBridge: RoomBridge;

	private mockMessageBridge: MessageBridge;

	private mockUserBridge: UserBridge;

	private mockBridges: AppBridges;

	@SetupFixture
	public setupFixture() {
		this.mockAppId = 'testing-app';

		this.mockRoomBridge = {
			doDelete(roomId: string, appId: string): Promise<void> {
				return Promise.resolve();
			},
			doRemoveUsers(roomId: string, usernames: Array<string>, appId: string): Promise<void> {
				return Promise.resolve();
			},
		} as RoomBridge;

		this.mockMessageBridge = {
			doDelete(message: IMessage, user: IUser, appId: string): Promise<void> {
				return Promise.resolve();
			},
		} as MessageBridge;

		this.mockUserBridge = {
			doDeleteUsersCreatedByApp(appId: string, userType: UserType): Promise<boolean> {
				return Promise.resolve(true);
			},
		} as UserBridge;

		const rmBridge = this.mockRoomBridge;
		const msgBridge = this.mockMessageBridge;
		const usrBridge = this.mockUserBridge;
		this.mockBridges = {
			getRoomBridge() {
				return rmBridge;
			},
			getMessageBridge() {
				return msgBridge;
			},
			getUserBridge() {
				return usrBridge;
			},
		} as AppBridges;
	}

	@AsyncTest()
	public async useModifyDeleter() {
		Expect(() => new ModifyDeleter(this.mockBridges, this.mockAppId)).not.toThrow();

		const md = new ModifyDeleter(this.mockBridges, this.mockAppId);

		const spRoom = SpyOn(this.mockRoomBridge, 'doDelete');
		const spMsg = SpyOn(this.mockMessageBridge, 'doDelete');
		const spUser = SpyOn(this.mockUserBridge, 'doDeleteUsersCreatedByApp');

		await md.deleteRoom('room-id');
		Expect(this.mockRoomBridge.doDelete).toHaveBeenCalledWith('room-id', this.mockAppId);

		const message = TestData.getMessage();
		const user = TestData.getUser();
		await md.deleteMessage(message, user);
		Expect(this.mockMessageBridge.doDelete).toHaveBeenCalledWith(message, user, this.mockAppId);

		const result = await md.deleteUsers('app-id', UserType.APP);
		Expect(this.mockUserBridge.doDeleteUsersCreatedByApp).toHaveBeenCalledWith('app-id', UserType.APP);
		Expect(result).toBe(true);

		await md.deleteUsers('app-id', UserType.BOT);
		Expect(this.mockUserBridge.doDeleteUsersCreatedByApp).toHaveBeenCalledWith('app-id', UserType.BOT);

		spRoom.restore();
		spMsg.restore();
		spUser.restore();
	}

	@AsyncTest()
	public async removeUsersFromRoom() {
		const md = new ModifyDeleter(this.mockBridges, this.mockAppId);

		const spRemove = SpyOn(this.mockRoomBridge, 'doRemoveUsers');

		const usernames = ['user1', 'user2', 'user3'];
		await md.removeUsersFromRoom('room-id', usernames);
		Expect(this.mockRoomBridge.doRemoveUsers).toHaveBeenCalledWith('room-id', usernames, this.mockAppId);

		spRemove.restore();
	}

	@AsyncTest()
	public async removeUsersFromRoomAtBoundary() {
		const md = new ModifyDeleter(this.mockBridges, this.mockAppId);

		const spRemove = SpyOn(this.mockRoomBridge, 'doRemoveUsers');

		const fiftyUsers = Array.from({ length: 50 }, (_, i) => `user${i}`);
		await md.removeUsersFromRoom('room-id', fiftyUsers);
		Expect(this.mockRoomBridge.doRemoveUsers).toHaveBeenCalledWith('room-id', fiftyUsers, this.mockAppId);

		spRemove.restore();
	}

	@AsyncTest()
	public async removeUsersFromRoomThrowsWhenExceedingLimit() {
		const md = new ModifyDeleter(this.mockBridges, this.mockAppId);

		const tooManyUsers = Array.from({ length: 51 }, (_, i) => `user${i}`);

		await Expect(async () => md.removeUsersFromRoom('room-id', tooManyUsers)).toThrowAsync();
	}
}
