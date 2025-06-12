import type { IHomeserverConfig } from '@rocket.chat/core-services';
import type { FederatedHomeserverUser } from '../domain/FederatedHomeserverUser';

export abstract class AbstractHomeserverApplicationService {
	protected homeserverConfig: IHomeserverConfig;

	constructor(homeserverConfig: IHomeserverConfig) {
		this.homeserverConfig = homeserverConfig;
	}

	protected getHomeserverDomain(): string {
		return this.homeserverConfig.domain;
	}

	protected async createUserIfNotExists(
		externalUserId: string,
		_username: string,
		_displayName?: string,
	): Promise<FederatedHomeserverUser> {
		// This will be implemented when we create the user adapter
		// For now, return a dummy user
		const { FederatedHomeserverUser } = await import('../domain/FederatedHomeserverUser');
		return FederatedHomeserverUser.createFromExternalId(externalUserId);
	}

	protected async updateUserDisplayName(userId: string, displayName: string): Promise<void> {
		// This will be implemented when we create the user adapter
		console.log(`[AbstractHomeserverApplicationService] Update display name for ${userId}: ${displayName}`);
	}

	protected async updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
		// This will be implemented when we create the user adapter
		console.log(`[AbstractHomeserverApplicationService] Update avatar for ${userId}: ${avatarUrl}`);
	}

	protected isExternalIdentifier(identifier: string): boolean {
		// Check if the identifier belongs to an external homeserver
		// Format: @user:domain or !room:domain
		if (!identifier.includes(':')) {
			return false;
		}
		
		const domain = identifier.split(':')[1];
		return domain !== this.homeserverConfig.domain && domain !== 'local';
	}
}