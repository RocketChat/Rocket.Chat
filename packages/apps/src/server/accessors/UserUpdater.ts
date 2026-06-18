import type { IUserUpdater } from '@rocket.chat/apps-engine/definition/accessors/IUserUpdater';
import type { UserStatusConnection } from '@rocket.chat/apps-engine/definition/users';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser';

import type { AppBridges } from '../bridges';

export class UserUpdater implements IUserUpdater {
	constructor(
		private readonly bridges: AppBridges,
		private readonly appId: string,
	) {}

	public async updateStatusText(user: IUser, statusText: IUser['statusText']) {
		return this.bridges.getUserBridge().doUpdate(user, { statusText }, this.appId);
	}

	public async updateStatus(user: IUser, statusText: IUser['statusText'], status: UserStatusConnection) {
		return this.bridges.getUserBridge().doUpdate(user, { statusText, status }, this.appId);
	}

	public async updateBio(user: IUser, bio: IUser['bio']) {
		return this.bridges.getUserBridge().doUpdate(user, { bio }, this.appId);
	}

	public async updateCustomFields(user: IUser, customFields: IUser['customFields']) {
		return this.bridges.getUserBridge().doUpdate(user, { customFields }, this.appId);
	}

	public async deactivate(userId: IUser['id'], confirmRelinquish: boolean) {
		return this.bridges.getUserBridge().doDeactivate(userId, confirmRelinquish, this.appId);
	}

	public async setActiveState(
		userId: IUser['id'],
		state: Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt'>,
	) {
		return this.bridges.getUserBridge().doSetActiveState(userId, state, this.appId);
	}

	public async endActiveState(userId: IUser['id']) {
		return this.bridges.getUserBridge().doEndActiveState(userId, this.appId);
	}
}
