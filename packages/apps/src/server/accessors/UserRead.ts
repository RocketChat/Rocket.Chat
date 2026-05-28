import type { IUserRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type { UserBridge } from '../bridges/UserBridge';

export class UserRead implements IUserRead {
	constructor(
		private userBridge: UserBridge,
		private appId: string,
	) {}

	public getById(id: string): Promise<IUser> {
		return this.userBridge.doGetById(id, this.appId);
	}

	public getByUsername(username: string): Promise<IUser> {
		return this.userBridge.doGetByUsername(username, this.appId);
	}

	public getBySipExtension(extension: string): Promise<IUser | undefined> {
		if (!extension) {
			return Promise.resolve(undefined);
		}

		return this.userBridge.doGetBySipExtension(extension, this.appId);
	}

	public getAppUser(appId: string = this.appId): Promise<IUser | undefined> {
		return this.userBridge.doGetAppUser(appId);
	}

	public getUserUnreadMessageCount(uid: string): Promise<number> {
		return this.userBridge.doGetUserUnreadMessageCount(uid, this.appId);
	}

	public getUserRoomIds(userId: string): Promise<string[]> {
		return this.userBridge.doGetUserRoomIds(userId, this.appId);
	}
}
