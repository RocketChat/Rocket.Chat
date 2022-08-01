import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { FederationService } from '../../../../../../app/federation-v2/server/application/AbstractFederationService';
import { RocketChatSettingsAdapter } from '../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { DirectMessageFederatedRoomEE, FederatedRoomEE } from '../../domain/FederatedRoom';
import { FederatedUserEE } from '../../domain/FederatedUser';
import { IFederationBridgeEE } from '../../domain/IFederationBridge';
import { RocketChatNotificationAdapter } from '../../infrastructure/rocket-chat/adapters/Notification';
import { RocketChatRoomAdapterEE } from '../../infrastructure/rocket-chat/adapters/Room';
import { RocketChatUserAdapterEE } from '../../infrastructure/rocket-chat/adapters/User';
import {
	FederationBeforeDirectMessageRoomCreationDto,
	FederationOnDirectMessageRoomCreationDto,
	FederationRoomInviteUserDto,
} from '../input/RoomSenderDto';

export class FederationDMRoomInternalHooksServiceSender extends FederationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapterEE,
		protected internalUserAdapter: RocketChatUserAdapterEE,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected internalNotificationAdapter: RocketChatNotificationAdapter,
		protected bridge: IFederationBridgeEE,
	) {
		super(bridge, internalUserAdapter, internalSettingsAdapter);
	}

	public async onDirectMessageRoomCreation(dmRoomOnCreationInput: FederationOnDirectMessageRoomCreationDto): Promise<void> {
		const { internalRoomId, internalInviterId, invitees, inviteComesFromAnExternalHomeServer } = dmRoomOnCreationInput;

		if (invitees.length === 0 || inviteComesFromAnExternalHomeServer) {
			return;
		}
		await this.createExternalDirectMessageRoomAndInviteUsers({
			internalInviterId,
			internalRoomId,
			invitees,
			inviteComesFromAnExternalHomeServer,
		});
	}

	public async beforeDirectMessageRoomCreation(dmBeforeRoomCreationInput: FederationBeforeDirectMessageRoomCreationDto): Promise<void> {
		const { invitees = [] } = dmBeforeRoomCreationInput;

		if (invitees.length === 0) {
			return;
		}

		const externalUsersToBeCreatedLocally = invitees.filter(
			(invitee) =>
				!FederatedUserEE.isAnInternalUser(this.bridge.extractHomeserverOrigin(invitee.rawInviteeId), this.internalHomeServerDomain),
		);

		await Promise.all(
			externalUsersToBeCreatedLocally.map((invitee) =>
				this.internalUserAdapter.createLocalUser(
					FederatedUserEE.createInstance('', {
						username: invitee.normalizedInviteeId,
						name: invitee.normalizedInviteeId,
						existsOnlyOnProxyServer: false,
					}),
				),
			),
		);
	}

	private async createExternalDirectMessageRoomAndInviteUsers(
		dmRoomOnCreationInput: FederationOnDirectMessageRoomCreationDto,
	): Promise<void> {
		const { internalRoomId, internalInviterId, invitees } = dmRoomOnCreationInput;

		const inviterUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId);
		if (!inviterUser) {
			const internalUser = await this.internalUserAdapter.getInternalUserById(internalInviterId);
			if (!internalUser || !internalUser.username) {
				throw new Error(`User with internalId ${internalInviterId} not found`);
			}
			const username = internalUser.username || internalInviterId;
			const name = internalUser.name || internalInviterId;
			const existsOnlyOnProxyServer = true;
			const externalInviterId = await this.bridge.createUser(username, name, this.internalHomeServerDomain);
			await this.createFederatedUser(externalInviterId, internalUser.username, existsOnlyOnProxyServer, name);
		}

		const federatedInviterUser = inviterUser || (await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId));
		if (!federatedInviterUser) {
			throw new Error(`User with internalId ${internalInviterId} not found`);
		}

		const isInviterFromTheSameHomeServer = FederatedUserEE.isAnInternalUser(
			this.bridge.extractHomeserverOrigin(federatedInviterUser.getExternalId()),
			this.internalHomeServerDomain,
		);
		const internalFederatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);

		if (!internalFederatedRoom && isInviterFromTheSameHomeServer) {
			const externalRoomId = await this.bridge.createDirectMessageRoom(
				federatedInviterUser.getExternalId(),
				invitees.map((invitee) => invitee.rawInviteeId),
			);
			const newFederatedRoom = DirectMessageFederatedRoomEE.createInstance(
				externalRoomId,
				externalRoomId,
				federatedInviterUser,
				RoomType.DIRECT_MESSAGE,
			);
			await this.internalRoomAdapter.updateFederatedRoomByInternalRoomId(internalRoomId, newFederatedRoom);
		}

		await Promise.all(
			invitees.map((member) =>
				this.createUserForDirectMessage({
					internalInviterId,
					internalRoomId,
					inviteeUsernameOnly: member.inviteeUsernameOnly,
					normalizedInviteeId: member.normalizedInviteeId,
					rawInviteeId: member.rawInviteeId,
				}),
			),
		);
	}

	private async createUserForDirectMessage(roomInviteUserInput: FederationRoomInviteUserDto): Promise<void> {
		const { normalizedInviteeId, inviteeUsernameOnly, rawInviteeId } = roomInviteUserInput;

		const isInviteeFromTheSameHomeServer = FederatedUserEE.isAnInternalUser(
			this.bridge.extractHomeserverOrigin(rawInviteeId),
			this.internalHomeServerDomain,
		);

		const username = isInviteeFromTheSameHomeServer ? inviteeUsernameOnly : normalizedInviteeId;
		const existsOnlyOnProxyServer = isInviteeFromTheSameHomeServer;
		const inviteeUser = await this.internalUserAdapter.getFederatedUserByInternalUsername(username);
		if (!inviteeUser) {
			await this.createFederatedUser(rawInviteeId, username, existsOnlyOnProxyServer);
		}

		if (!isInviteeFromTheSameHomeServer) {
			return;
		}

		const federatedInviteeUser = inviteeUser || (await this.internalUserAdapter.getFederatedUserByInternalUsername(inviteeUsernameOnly));
		if (!federatedInviteeUser) {
			throw new Error(`User with internalUsername ${inviteeUsernameOnly} not found`);
		}

		await this.bridge.createUser(
			inviteeUsernameOnly,
			federatedInviteeUser?.internalReference?.name || federatedInviteeUser.internalReference?.username || inviteeUsernameOnly,
			this.internalHomeServerDomain,
		);
	}
}
