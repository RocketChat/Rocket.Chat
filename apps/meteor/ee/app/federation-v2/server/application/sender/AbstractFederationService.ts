import { FederationService } from '../../../../../../app/federation-v2/server/application/AbstractFederationService';
import type { RocketChatFileAdapter } from '../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/File';
import type { RocketChatSettingsAdapter } from '../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { FederatedUserEE } from '../../domain/FederatedUser';
import type { IFederationBridgeEE } from '../../domain/IFederationBridge';
import type { RocketChatUserAdapterEE } from '../../infrastructure/rocket-chat/adapters/User';
import type { IFederationInviteeDto } from '../input/RoomSenderDto';

export abstract class FederationServiceEE extends FederationService {
	constructor(
		protected bridge: IFederationBridgeEE,
		protected internalUserAdapter: RocketChatUserAdapterEE,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	protected async createUsersLocallyOnly(invitees: IFederationInviteeDto[]): Promise<void> {
		const externalUsersToBeCreatedLocally = invitees.filter(
			(invitee) =>
				!FederatedUserEE.isOriginalFromTheProxyServer(
					this.bridge.extractHomeserverOrigin(invitee.rawInviteeId),
					this.internalHomeServerDomain,
				),
		);

		for await (const invitee of externalUsersToBeCreatedLocally) {
			const externalUserProfileInformation = await this.bridge.getUserProfileInformation(invitee.rawInviteeId);

			const name = externalUserProfileInformation?.displayName || invitee.normalizedInviteeId;
			const username = invitee.normalizedInviteeId;
			const existsOnlyOnProxyServer = false;

			await this.internalUserAdapter.createLocalUser(
				FederatedUserEE.createLocalInstanceOnly({
					username,
					name,
					existsOnlyOnProxyServer,
				}),
			);

			const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(invitee.rawInviteeId);
			if (!federatedUser) {
				return;
			}
			await this.updateUserAvatarInternally(federatedUser, externalUserProfileInformation?.avatarUrl);
			await this.updateUserDisplayNameInternally(federatedUser, externalUserProfileInformation?.displayName);
		}
	}
}
