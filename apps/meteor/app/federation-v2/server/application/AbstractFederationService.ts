import { FederatedUser } from '../domain/FederatedUser';
import { IFederationBridge } from '../domain/IFederationBridge';
import { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';

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

	protected isAnInternalIdentifier(externalIdentifier: string): boolean {
		return FederatedUser.isAnInternalUser(this.bridge.extractHomeserverOrigin(externalIdentifier), this.internalHomeServerDomain);
	}
}
