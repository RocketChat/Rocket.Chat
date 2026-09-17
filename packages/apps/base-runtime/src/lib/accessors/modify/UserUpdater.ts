import type { IUserUpdater } from '@rocket.chat/apps-engine/definition/accessors/IUserUpdater';
import type { UserStatusConnection } from '@rocket.chat/apps-engine/definition/users';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class UserUpdater implements IUserUpdater {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async updateStatusText(user: IUser, statusText: IUser['statusText']) {
		return bridgeCall<boolean>(this.senderFn, 'getUserBridge', 'doUpdate', user, { statusText }, 'APP_ID');
	}

	public async updateStatus(user: IUser, statusText: IUser['statusText'], status: UserStatusConnection) {
		return bridgeCall<boolean>(this.senderFn, 'getUserBridge', 'doUpdate', user, { statusText, status }, 'APP_ID');
	}

	public async updateBio(user: IUser, bio: IUser['bio']) {
		return bridgeCall<boolean>(this.senderFn, 'getUserBridge', 'doUpdate', user, { bio }, 'APP_ID');
	}

	public async updateCustomFields(user: IUser, customFields: IUser['customFields']) {
		return bridgeCall<boolean>(this.senderFn, 'getUserBridge', 'doUpdate', user, { customFields }, 'APP_ID');
	}

	public async deactivate(userId: IUser['id'], confirmRelinquish: boolean) {
		return bridgeCall<boolean>(this.senderFn, 'getUserBridge', 'doDeactivate', userId, confirmRelinquish, 'APP_ID');
	}

	public async setActiveState(
		userId: IUser['id'],
		state: Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt' | 'statusId'>,
	): Promise<void> {
		await bridgeCall(this.senderFn, 'getUserBridge', 'doSetActiveState', userId, state, 'APP_ID');
	}

	public async endActiveState(userId: IUser['id'], statusId?: string): Promise<void> {
		await bridgeCall(this.senderFn, 'getUserBridge', 'doEndActiveState', userId, 'APP_ID', statusId);
	}
}
