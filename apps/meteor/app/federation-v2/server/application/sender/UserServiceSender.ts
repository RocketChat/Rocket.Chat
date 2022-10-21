import type { IFederationBridge } from '../../domain/IFederationBridge';
import type { RocketChatFileAdapter } from '../../infrastructure/rocket-chat/adapters/File';
import type { RocketChatSettingsAdapter } from '../../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../../infrastructure/rocket-chat/adapters/User';
import { FederationService } from '../AbstractFederationService';

export class FederationUserServiceSender extends FederationService {
	constructor(
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	public async afterUserAvatarChanged(internalUsername: string): Promise<void> {
		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalUsername(internalUsername);
		if (!federatedUser) {
			return;
		}

		if (federatedUser.isRemote()) {
			return;
		}

		await this.updateUserAvatarExternally(federatedUser.getInternalReference(), federatedUser);
	}

	public async afterUserRealNameChanged(internalUserId: string, name: string): Promise<void> {
		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			return;
		}

		if (federatedUser.isRemote() || !federatedUser.shouldUpdateDisplayName(name)) {
			return;
		}

		await this.bridge.setUserDisplayName(federatedUser.getExternalId(), name);
	}
}
