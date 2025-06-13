import type { IUser } from '@rocket.chat/core-typings';
import type { HomeserverUser } from '@rocket.chat/core-services';
import { FederatedHomeserverUser } from '../../../domain/FederatedHomeserverUser';

export class UserConverter {
	constructor(private homeserverDomain: string) {}

	/**
	 * Convert Rocket.Chat user to Homeserver user format
	 */
	public toHomeserverUser(user: IUser): HomeserverUser {
		return {
			id: this.toExternalUserId(user),
			username: user.username || user._id,
			displayName: user.name || user.username,
			avatarUrl: user.avatarUrl,
		};
	}

	/**
	 * Convert Homeserver user to Rocket.Chat user format
	 */
	public toRocketChatUser(homeserverUser: HomeserverUser): Partial<IUser> {
		const username = this.extractUsernameFromExternalId(homeserverUser.id);
		
		return {
			username,
			name: homeserverUser.displayName || username,
			// Note: avatarUrl will need special handling as it might be an external URL
		};
	}

	/**
	 * Generate external user ID from internal user
	 */
	public toExternalUserId(user: IUser): string {
		const username = user.username || user._id;
		return `@${username}:${this.homeserverDomain}`;
	}

	/**
	 * Extract username from external user ID
	 * Format: @username:domain
	 */
	public extractUsernameFromExternalId(externalId: string): string {
		if (!externalId.startsWith('@')) {
			throw new Error(`Invalid external user ID format: ${externalId}`);
		}
		
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			throw new Error(`Invalid external user ID format: ${externalId}`);
		}
		
		return externalId.substring(1, colonIndex);
	}

	/**
	 * Extract domain from external user ID
	 */
	public extractDomainFromExternalId(externalId: string): string {
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			throw new Error(`Invalid external user ID format: ${externalId}`);
		}
		
		return externalId.substring(colonIndex + 1);
	}

	/**
	 * Check if user is from local homeserver
	 */
	public isLocalUser(externalId: string): boolean {
		try {
			const domain = this.extractDomainFromExternalId(externalId);
			return domain === this.homeserverDomain || domain === 'local';
		} catch {
			return false;
		}
	}

	/**
	 * Create federated user domain object
	 */
	public toFederatedUser(
		internalId: string,
		externalId: string,
		homeserverUser: HomeserverUser,
	): FederatedHomeserverUser {
		return new FederatedHomeserverUser(
			internalId,
			externalId,
			homeserverUser.username,
			homeserverUser.displayName,
			homeserverUser.avatarUrl,
			this.extractDomainFromExternalId(externalId),
		);
	}
}