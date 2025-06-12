import type { IHomeserverConfig } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { AbstractHomeserverApplicationService } from '../../AbstractHomeserverApplicationService';
import type { IFederationHomeserverBridge } from '../../../domain/IFederationHomeserverBridge';

export interface IHomeserverUserAdapterForUserSender {
	getOrCreateExternalUserId(user: IUser): Promise<string>;
	storeExternalUserId(internalUserId: string, externalUserId: string): Promise<void>;
}

export class UserServiceSender extends AbstractHomeserverApplicationService {
	constructor(
		homeserverConfig: IHomeserverConfig,
		private bridge: IFederationHomeserverBridge,
		private userAdapter: IHomeserverUserAdapterForUserSender,
	) {
		super(homeserverConfig);
	}

	public async createUser(user: IUser): Promise<void> {
		console.log('[UserServiceSender] Creating user on homeserver:', user._id, user.username);

		try {
			// 1. Create user via bridge
			const externalUserId = await this.bridge.createUser(
				user.username || user._id,
				user.name || user.username || user._id,
			);

			// 2. Store the mapping
			await this.userAdapter.storeExternalUserId(user._id, externalUserId);

			console.log('[UserServiceSender] User created successfully:', externalUserId);
		} catch (error) {
			console.error('[UserServiceSender] Failed to create user:', error);
			throw error;
		}
	}

	public async updateUserProfile(user: IUser): Promise<void> {
		console.log('[UserServiceSender] Updating user profile on homeserver:', user._id);

		try {
			// 1. Get external user ID
			const externalUserId = await this.userAdapter.getOrCreateExternalUserId(user);

			// 2. Update profile via bridge
			await this.bridge.updateUserProfile(
				externalUserId,
				user.name || user.username,
				user.avatarUrl,
			);

			console.log('[UserServiceSender] User profile updated successfully');
		} catch (error) {
			console.error('[UserServiceSender] Failed to update user profile:', error);
			throw error;
		}
	}
}