import { FederatedUser } from '../domain/FederatedUser';
import type { IFederationBridge } from '../domain/IFederationBridge';
import type { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';

export abstract class FederationService {
	protected internalHomeServerDomain: string;

	constructor(
		protected bridge: IFederationBridge,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
	) {
		this.internalHomeServerDomain = this.internalSettingsAdapter.getHomeServerDomain();
	}

	protected async createFederatedUser(
		externalUserId: string,
		username: string,
		existsOnlyOnProxyServer = false,
		providedName?: string,
	): Promise<void> {
		const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalUserId);
		const name = externalUserProfileInformation?.displayName || providedName || username;
		const federatedUser = FederatedUser.createInstance(externalUserId, {
			name,
			username,
			existsOnlyOnProxyServer,
		});

		await this.internalUserAdapter.createFederatedUser(federatedUser);
	}

	protected async createFederatedUserForInviterUsingLocalInformation(internalInviterId: string): Promise<string> {
		const internalUser = await this.internalUserAdapter.getInternalUserById(internalInviterId);
		if (!internalUser || !internalUser?.username) {
			throw new Error(`Could not find user id for ${internalInviterId}`);
		}
		const name = internalUser.name || internalUser.username;
		const externalInviterId = await this.bridge.createUser(internalUser.username, name, this.internalHomeServerDomain);
		const existsOnlyOnProxyServer = true;
		await this.createFederatedUser(externalInviterId, internalUser.username, existsOnlyOnProxyServer, name);

		return externalInviterId;
	}
}
