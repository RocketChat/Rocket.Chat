import type { IUserRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class UserRead implements IUserRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public getById(id: string): Promise<IUser> {
		return this.bridges.getUserBridge().doGetById(id, 'APP_ID') as Promise<IUser>;
	}

	public getByUsername(username: string): Promise<IUser> {
		return this.bridges.getUserBridge().doGetByUsername(username, 'APP_ID') as Promise<IUser>;
	}

	public getBySipExtension(extension: string): Promise<IUser | undefined> {
		if (!extension) {
			return Promise.resolve(undefined);
		}

		return this.bridges.getUserBridge().doGetBySipExtension(extension, 'APP_ID') as Promise<IUser | undefined>;
	}

	// `appId` is an app-supplied argument, not caller identity, so it is NOT normalized
	// to the 'APP_ID' sentinel - it defaults to the sentinel only when the app omits it.
	// See docs/base-runtime-app-id-exceptions.md (bucket B).
	public getAppUser(appId: string = 'APP_ID'): Promise<IUser | undefined> {
		return this.bridges.getUserBridge().doGetAppUser(appId) as Promise<IUser | undefined>;
	}

	public getUserUnreadMessageCount(uid: string): Promise<number> {
		return this.bridges.getUserBridge().doGetUserUnreadMessageCount(uid, 'APP_ID') as Promise<number>;
	}

	public getUserRoomIds(userId: string): Promise<string[]> {
		return this.bridges.getUserBridge().doGetUserRoomIds(userId, 'APP_ID') as Promise<string[]>;
	}
}
