import type { IUser } from '@rocket.chat/core-typings';
import type { FederatedHomeserverUser } from '../../../domain/FederatedHomeserverUser';

export class UserConverter {
	constructor(private homeserverDomain: string) {}

	// Convert Rocket.Chat user to Homeserver user format
	public toHomeserverUser(user: IUser, externalId?: string): FederatedHomeserverUser {
		const federatedUser: FederatedHomeserverUser = {
			externalId: externalId || this.generateExternalUserId(user),
			username: user.username || user._id,
			displayName: user.name,
			avatarUrl: this.getUserAvatarUrl(user),
			isActive: user.active !== false,
			createdAt: user.createdAt || new Date(),
			updatedAt: user._updatedAt || new Date(),
		};

		return federatedUser;
	}

	// Convert Homeserver user event to Rocket.Chat user data
	public toRocketChatUserData(homeserverUser: any): Partial<IUser> {
		return {
			username: this.extractUsername(homeserverUser.id || homeserverUser.user_id),
			name: homeserverUser.displayname || homeserverUser.display_name,
			status: 'offline',
			active: true,
			type: 'user',
			federated: true,
			emails: [],
			roles: ['user'],
			federation: {
				type: 'homeserver',
				externalId: homeserverUser.id || homeserverUser.user_id,
				domain: this.extractDomain(homeserverUser.id || homeserverUser.user_id),
			},
		};
	}

	// Generate external user ID for a Rocket.Chat user
	public generateExternalUserId(user: IUser): string {
		const username = user.username || user._id;
		return `@${username}:${this.homeserverDomain}`;
	}

	// Extract username from external user ID
	public extractUsername(externalUserId: string): string {
		// Remove @ prefix and domain suffix
		const match = externalUserId.match(/^@(.+):.+$/);
		return match ? match[1] : externalUserId;
	}

	// Extract domain from external user ID
	private extractDomain(externalId: string): string {
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			return this.homeserverDomain;
		}
		return externalId.substring(colonIndex + 1);
	}

	// Get user avatar URL
	private getUserAvatarUrl(user: IUser): string | undefined {
		// In a real implementation, this would construct the proper avatar URL
		// For now, return undefined as avatar handling is complex
		return undefined;
	}

	// Convert user profile update event
	public convertProfileUpdateEvent(event: any): {
		userId: string;
		displayName?: string;
		avatarUrl?: string;
	} {
		return {
			userId: event.user_id || event.sender,
			displayName: event.content?.displayname,
			avatarUrl: event.content?.avatar_url,
		};
	}

	// Convert user presence event
	public convertPresenceEvent(event: any): {
		userId: string;
		presence: 'online' | 'offline' | 'unavailable';
		lastActiveAgo?: number;
		statusMsg?: string;
	} {
		return {
			userId: event.sender,
			presence: event.content?.presence || 'offline',
			lastActiveAgo: event.content?.last_active_ago,
			statusMsg: event.content?.status_msg,
		};
	}

	// Check if user should be federated
	public shouldFederateUser(user: IUser): boolean {
		// Don't federate system users or bots (unless specifically marked for federation)
		if (user.type !== 'user') {
			return false;
		}

		// Don't federate users that are already federated from another source
		if (user.federated && user.federation?.type !== 'homeserver') {
			return false;
		}

		return true;
	}
}