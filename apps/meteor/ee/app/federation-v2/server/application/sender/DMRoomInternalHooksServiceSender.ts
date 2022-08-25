import type { RocketChatSettingsAdapter } from '../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { FederatedUserEE } from '../../domain/FederatedUser';
import type { IFederationBridgeEE } from '../../domain/IFederationBridge';
import type { RocketChatRoomAdapterEE } from '../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatUserAdapterEE } from '../../infrastructure/rocket-chat/adapters/User';
import type {
	FederationBeforeDirectMessageRoomCreationDto,
	FederationOnDirectMessageRoomCreationDto,
	FederationRoomInviteUserDto,
} from '../input/RoomSenderDto';
import { FederationServiceEE } from './AbstractFederationService';

export class FederationDMRoomInternalHooksServiceSender extends FederationServiceEE {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapterEE,
		protected internalUserAdapter: RocketChatUserAdapterEE,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
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

		await this.createUsersLocallyOnly(invitees);
	}

	private async createExternalDirectMessageRoomAndInviteUsers(
		dmRoomOnCreationInput: FederationOnDirectMessageRoomCreationDto,
	): Promise<void> {
		const { internalRoomId, internalInviterId, invitees } = dmRoomOnCreationInput;

		const inviterUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId);
		if (!inviterUser) {
			const internalUser = await this.internalUserAdapter.getInternalUserById(internalInviterId);
			const username = internalUser.username || internalInviterId;
			const name = internalUser.name || internalInviterId;
			const existsOnlyOnProxyServer = true;
			const externalInviterId = await this.bridge.createUser(username, name, this.internalHomeServerDomain);

			await this.createFederatedUser(externalInviterId, username, existsOnlyOnProxyServer, name);
		}

		const federatedInviterUser = inviterUser || (await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId));
		if (!federatedInviterUser) {
			throw new Error(`User with internalId ${internalInviterId} not found`);
		}

		const isInviterFromTheSameHomeServer = FederatedUserEE.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedInviterUser.getExternalId()),
			this.internalHomeServerDomain,
		);
		const internalFederatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);

		if (!internalFederatedRoom && isInviterFromTheSameHomeServer) {
			const externalInviteeIds = invitees.map((invitee) => invitee.rawInviteeId);
			const externalRoomId = await this.bridge.createDirectMessageRoom(federatedInviterUser.getExternalId(), externalInviteeIds, {
				internalRoomId,
			});
			await this.internalRoomAdapter.updateFederatedRoomByInternalRoomId(internalRoomId, externalRoomId);
		}

		await Promise.all(
			invitees.map((member) =>
				this.createUserForDirectMessageRoom({
					internalInviterId,
					internalRoomId,
					inviteeUsernameOnly: member.inviteeUsernameOnly,
					normalizedInviteeId: member.normalizedInviteeId,
					rawInviteeId: member.rawInviteeId,
				}),
			),
		);
	}

	private async createUserForDirectMessageRoom(roomInviteUserInput: FederationRoomInviteUserDto): Promise<void> {
		const { normalizedInviteeId, inviteeUsernameOnly, rawInviteeId } = roomInviteUserInput;

		const isInviteeFromTheSameHomeServer = FederatedUserEE.isOriginalFromTheProxyServer(
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

		const profile = await this.bridge.getUserProfileInformation(federatedInviteeUser.getExternalId());
		if (profile) {
			return;
		}

		await this.bridge.createUser(
			inviteeUsernameOnly,
			federatedInviteeUser.getName() || federatedInviteeUser.getUsername() || inviteeUsernameOnly,
			this.internalHomeServerDomain,
		);
	}
}
