import type { IUserRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class UserRead implements IUserRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getById(id: string): Promise<IUser> {
		return bridgeCall<IUser>(this.senderFn, 'getUserBridge', 'doGetById', id, 'APP_ID');
	}

	public getByUsername(username: string): Promise<IUser> {
		return bridgeCall<IUser>(this.senderFn, 'getUserBridge', 'doGetByUsername', username, 'APP_ID');
	}

	public getBySipExtension(extension: string): Promise<IUser | undefined> {
		if (!extension) {
			return Promise.resolve(undefined);
		}

		return bridgeCall<IUser | undefined>(this.senderFn, 'getUserBridge', 'doGetBySipExtension', extension, 'APP_ID');
	}

	// `appId` is an app-supplied argument, not caller identity, so it is NOT normalized
	// to the 'APP_ID' sentinel - it defaults to the sentinel only when the app omits it.
	// See docs/base-runtime-app-id-exceptions.md (bucket B).
	public getAppUser(appId: string = 'APP_ID'): Promise<IUser | undefined> {
		return bridgeCall<IUser | undefined>(this.senderFn, 'getUserBridge', 'doGetAppUser', appId);
	}

	public getUserUnreadMessageCount(uid: string): Promise<number> {
		return bridgeCall<number>(this.senderFn, 'getUserBridge', 'doGetUserUnreadMessageCount', uid, 'APP_ID');
	}

	public getUserRoomIds(userId: string): Promise<string[]> {
		return bridgeCall<string[]>(this.senderFn, 'getUserBridge', 'doGetUserRoomIds', userId, 'APP_ID');
	}
}
