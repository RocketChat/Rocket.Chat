import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { getConnection } from '@rocket.chat/models/dist/lib/BaseRaw';
import { Random } from '@rocket.chat/random';
import { HomeserverFederationMapping } from './HomeserverFederationMapping';
import type { IHomeserverUserAdapter } from '../../../application/message/receiver/MessageServiceReceiver';
import type { IHomeserverUserAdapterForReceiver } from '../../../application/room/receiver/RoomServiceReceiver';
import type { IHomeserverUserAdapterForUserReceiver } from '../../../application/user/receiver/UserServiceReceiver';
import type { IHomeserverUserAdapterForSender } from '../../../application/message/sender/MessageServiceSender';
import type { IHomeserverUserAdapterForRoomSender } from '../../../application/room/sender/RoomServiceSender';
import type { IHomeserverUserAdapterForUserSender } from '../../../application/user/sender/UserServiceSender';

export class UserAdapter implements 
	IHomeserverUserAdapter,
	IHomeserverUserAdapterForReceiver,
	IHomeserverUserAdapterForUserReceiver,
	IHomeserverUserAdapterForSender,
	IHomeserverUserAdapterForRoomSender,
	IHomeserverUserAdapterForUserSender {
	
	constructor(private homeserverDomain: string) {}

	// Get database connection
	private async getDb() {
		return getConnection().db;
	}

	// Get user by external ID
	async getUserByExternalId(externalId: string): Promise<{ _id: string; username: string } | null> {
		// First try to find by federation metadata
		const user = await Users.findOne({ 'federation.externalId': externalId });
		if (user) {
			return { _id: user._id, username: user.username || user._id };
		}

		// Fallback to mapping collection
		const db = await this.getDb();
		const mapping = await HomeserverFederationMapping.findByExternalId('user', externalId, db);
		
		if (!mapping) {
			return null;
		}

		const mappedUser = await Users.findOneById(mapping.internalId);
		return mappedUser ? { _id: mappedUser._id, username: mappedUser.username || mappedUser._id } : null;
	}

	// Get external user ID from internal ID
	async getExternalUserId(internalUserId: string): Promise<string | null> {
		// First try to get from user metadata
		const user = await Users.findOneById(internalUserId);
		if (user?.federation?.externalId) {
			return user.federation.externalId;
		}

		// Fallback to mapping collection
		const db = await this.getDb();
		const mapping = await HomeserverFederationMapping.findByInternalId('user', internalUserId, db);
		return mapping?.externalId || null;
	}

	// Get or create external user ID
	async getOrCreateExternalUserId(user: IUser): Promise<string> {
		// First check if mapping exists
		const existingExternalId = await this.getExternalUserId(user._id);
		if (existingExternalId) {
			return existingExternalId;
		}

		// Create new external ID
		const username = user.username || user._id;
		const externalUserId = `@${username}:${this.homeserverDomain}`;

		// Store the mapping
		await this.storeExternalUserId(user._id, externalUserId);
		
		return externalUserId;
	}

	// Store external user ID mapping
	async storeExternalUserId(internalUserId: string, externalUserId: string): Promise<void> {
		// Update user with federation metadata
		await Users.updateOne(
			{ _id: internalUserId },
			{
				$set: {
					federated: true,
					federation: {
						type: 'homeserver',
						externalId: externalUserId,
						domain: this.extractDomain(externalUserId),
					},
				},
			},
		);

		// Also store in mapping collection
		const db = await this.getDb();
		await HomeserverFederationMapping.createOrUpdate({
			type: 'user',
			internalId: internalUserId,
			externalId: externalUserId,
			homeserverDomain: this.extractDomain(externalUserId),
		}, db);
	}

	// Create a federated user in Rocket.Chat
	async createFederatedUser(
		externalId: string, 
		username: string, 
		displayName?: string
	): Promise<{ _id: string; username: string }> {
		// Check if user already exists
		const existingUser = await this.getUserByExternalId(externalId);
		if (existingUser) {
			return existingUser;
		}

		// Generate unique username if needed
		let finalUsername = username;
		let suffix = 0;
		while (await Users.findOneByUsername(finalUsername)) {
			suffix++;
			finalUsername = `${username}-${suffix}`;
		}

		// Create the user with federation metadata
		const userId = Random.id();
		const user: Partial<IUser> = {
			_id: userId,
			username: finalUsername,
			name: displayName || username,
			status: 'offline',
			active: true,
			type: 'user',
			federated: true,
			emails: [],
			roles: ['user'],
			createdAt: new Date(),
			_updatedAt: new Date(),
			federation: {
				type: 'homeserver',
				externalId: externalId,
				domain: this.extractDomain(externalId),
			},
		};

		await Users.create(user as IUser);

		// Store the mapping in mapping collection
		const db = await this.getDb();
		await HomeserverFederationMapping.createOrUpdate({
			type: 'user',
			internalId: userId,
			externalId: externalId,
			homeserverDomain: this.extractDomain(externalId),
		}, db);

		return { _id: userId, username: finalUsername };
	}

	// Update user profile
	async updateUserProfile(userId: string, displayName?: string, avatarUrl?: string): Promise<void> {
		const updateData: Partial<IUser> = {
			_updatedAt: new Date(),
		};

		if (displayName !== undefined) {
			updateData.name = displayName;
		}

		if (avatarUrl !== undefined) {
			// Handle avatar URL update - might need additional processing
			// For now, we'll skip as it requires more complex handling
		}

		if (Object.keys(updateData).length > 1) { // More than just _updatedAt
			await Users.updateOne({ _id: userId }, { $set: updateData });
		}
	}

	// Extract domain from external user ID
	private extractDomain(externalId: string): string {
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			return this.homeserverDomain;
		}
		return externalId.substring(colonIndex + 1);
	}
}