import type { IUserUpdater } from '@rocket.chat/apps-engine/definition/accessors/IUserUpdater';
import type { UserStatusConnection } from '@rocket.chat/apps-engine/definition/users';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class UserUpdater implements IUserUpdater {
	constructor(private readonly bridges: RemoteBridges) {}

	public async updateStatusText(user: IUser, statusText: IUser['statusText']) {
		return this.bridges.getUserBridge().doUpdate(user, { statusText }, 'APP_ID') as Promise<boolean>;
	}

	public async updateStatus(user: IUser, statusText: IUser['statusText'], status: UserStatusConnection) {
		return this.bridges.getUserBridge().doUpdate(user, { statusText, status }, 'APP_ID') as Promise<boolean>;
	}

	public async updateBio(user: IUser, bio: IUser['bio']) {
		return this.bridges.getUserBridge().doUpdate(user, { bio }, 'APP_ID') as Promise<boolean>;
	}

	public async updateCustomFields(user: IUser, customFields: IUser['customFields']) {
		return this.bridges.getUserBridge().doUpdate(user, { customFields }, 'APP_ID') as Promise<boolean>;
	}

	public async deactivate(userId: IUser['id'], confirmRelinquish: boolean) {
		return this.bridges.getUserBridge().doDeactivate(userId, confirmRelinquish, 'APP_ID') as Promise<boolean>;
	}

	public async setActiveState(
		userId: IUser['id'],
		state: Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt' | 'statusId'>,
	): Promise<void> {
		await this.bridges.getUserBridge().doSetActiveState(userId, state, 'APP_ID');
	}

	public async endActiveState(userId: IUser['id'], statusId?: string): Promise<void> {
		await this.bridges.getUserBridge().doEndActiveState(userId, 'APP_ID', statusId);
	}
}
