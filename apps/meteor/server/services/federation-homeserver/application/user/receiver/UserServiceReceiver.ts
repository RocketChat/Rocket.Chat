import type { HomeserverUser, IHomeserverConfig } from '@rocket.chat/core-services';
import { AbstractHomeserverApplicationService } from '../../AbstractHomeserverApplicationService';
import type { IUserServiceReceiver } from '../../../infrastructure/homeserver/handlers/UserHandler';

export interface IHomeserverUserAdapterForUserReceiver {
	getUserByExternalId(externalId: string): Promise<{ _id: string } | null>;
	updateUserProfile(userId: string, displayName?: string, avatarUrl?: string): Promise<void>;
}

export class UserServiceReceiver extends AbstractHomeserverApplicationService implements IUserServiceReceiver {
	constructor(
		homeserverConfig: IHomeserverConfig,
		private userAdapter: IHomeserverUserAdapterForUserReceiver,
	) {
		super(homeserverConfig);
	}

	public async onExternalUserProfileUpdate(user: HomeserverUser): Promise<void> {
		console.log('[UserServiceReceiver] Processing user profile update:', user.id, user.username);

		try {
			// 1. Find user by external ID
			const internalUser = await this.userAdapter.getUserByExternalId(user.id);
			if (!internalUser) {
				console.warn('[UserServiceReceiver] User not found:', user.id);
				// User doesn't exist locally yet, we'll create them when they join a room
				return;
			}

			// 2. Update user profile
			await this.userAdapter.updateUserProfile(
				internalUser._id,
				user.displayName,
				user.avatarUrl,
			);

			console.log('[UserServiceReceiver] User profile updated successfully');
		} catch (error) {
			console.error('[UserServiceReceiver] Failed to update user profile:', error);
			throw error;
		}
	}
}