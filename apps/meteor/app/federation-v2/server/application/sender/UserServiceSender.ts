import type { IUser } from '@rocket.chat/core-typings';

import type { IFederationBridge } from '../../domain/IFederationBridge';
import type { RocketChatSettingsAdapter } from '../../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../../infrastructure/rocket-chat/adapters/User';
import { FederationService } from '../AbstractFederationService';
require('util').inspect.defaultOptions.depth = null;
export class FederationUserServiceSender extends FederationService {
	constructor(
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalSettingsAdapter);
	}

	public async afterUserAvatarChanged(internalUser: IUser): Promise<void> {
		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUser._id);
		if (!federatedUser) {
			return;
		}

		if (federatedUser.isRemote()) {
			return;
		}

		await this.updateUserAvatarExternally(internalUser, federatedUser);
	}
}
