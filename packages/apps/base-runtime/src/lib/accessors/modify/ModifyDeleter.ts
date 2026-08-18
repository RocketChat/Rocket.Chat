import type { IModifyDeleter } from '@rocket.chat/apps-engine/definition/accessors';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IUser, UserType } from '@rocket.chat/apps-engine/definition/users';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class ModifyDeleter implements IModifyDeleter {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async deleteRoom(roomId: string): Promise<void> {
		await bridgeCall(this.senderFn, 'getRoomBridge', 'doDelete', roomId, 'APP_ID');
	}

	// `appId` here is an app-supplied argument identifying which app's users to delete, not caller
	// identity, so it is forwarded raw (see
	// docs/proposals/apps-accessor-consolidation/base-runtime-app-id-exceptions.md, bucket B).
	public async deleteUsers(appId: Exclude<IUser['appId'], undefined>, userType: UserType.APP | UserType.BOT): Promise<boolean> {
		return bridgeCall<boolean>(this.senderFn, 'getUserBridge', 'doDeleteUsersCreatedByApp', appId, userType);
	}

	public async deleteMessage(message: IMessage, user: IUser): Promise<void> {
		await bridgeCall(this.senderFn, 'getMessageBridge', 'doDelete', message, user, 'APP_ID');
	}

	/**
	 * Removes `usernames` from the room's member list
	 *
	 * For performance reasons, it is only possible to remove 50 users in one
	 * call to this method. Removing users is an expensive operation due to the
	 * amount of entity relationships that need to be modified.
	 */
	public async removeUsersFromRoom(roomId: string, usernames: Array<string>) {
		if (usernames.length > 50) {
			throw new Error('A maximum of 50 members can be removed in a single call');
		}

		return bridgeCall<void>(this.senderFn, 'getRoomBridge', 'doRemoveUsers', roomId, usernames, 'APP_ID');
	}
}
