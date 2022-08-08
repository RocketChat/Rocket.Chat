import { FederationService } from '../../../../../../app/federation-v2/server/application/AbstractFederationService';
import type { RocketChatSettingsAdapter } from '../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { FederatedUserEE } from '../../domain/FederatedUser';
import type { IFederationBridgeEE } from '../../domain/IFederationBridge';
import type { RocketChatUserAdapterEE } from '../../infrastructure/rocket-chat/adapters/User';
import type { IFederationInviteeDto } from '../input/RoomSenderDto';

export abstract class FederationServiceEE extends FederationService {
	constructor(
		protected bridge: IFederationBridgeEE,
		protected internalUserAdapter: RocketChatUserAdapterEE,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
	) {
		super(bridge, internalUserAdapter, internalSettingsAdapter);
	}

	protected async createUsersLocallyOnly(invitees: IFederationInviteeDto[]): Promise<void> {
		const externalUsersToBeCreatedLocally = invitees.filter(
			(invitee) =>
				!FederatedUserEE.isOriginalFromTheProxyServer(
					this.bridge.extractHomeserverOrigin(invitee.rawInviteeId),
					this.internalHomeServerDomain,
				),
		);

		await Promise.all(
			externalUsersToBeCreatedLocally.map((invitee) =>
				this.internalUserAdapter.createLocalUser(
					FederatedUserEE.createLocalInstanceOnly({
						username: invitee.normalizedInviteeId,
						name: invitee.normalizedInviteeId,
						existsOnlyOnProxyServer: false,
					}),
				),
			),
		);
	}
}
