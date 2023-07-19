import { FederatedUser } from '../../../domain/FederatedUser';
import type { IFederationBridge } from '../../../domain/IFederationBridge';
import type { RocketChatFileAdapter } from '../../../infrastructure/rocket-chat/adapters/File';
import type { RocketChatRoomAdapter } from '../../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from '../../../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../../../infrastructure/rocket-chat/adapters/User';
import { AbstractFederationApplicationService } from '../../AbstractFederationApplicationService';
import type {
	FederationBeforeDirectMessageRoomCreationDto,
	FederationCreateDirectMessageDto,
	FederationOnDirectMessageRoomCreationDto,
	FederationRoomInviteUserDto,
} from '../input/RoomSenderDto';

export class FederationDirectMessageRoomServiceSender extends AbstractFederationApplicationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	public async onDirectMessageRoomCreation(dmRoomOnCreationInput: FederationOnDirectMessageRoomCreationDto): Promise<void> {
		const { internalRoomId, internalInviterId, invitees, inviteComesFromAnExternalHomeServer } = dmRoomOnCreationInput;
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();

		const atLeastOneExternalUser = invitees.some(
			(invitee) =>
				!FederatedUser.isOriginalFromTheProxyServer(
					this.bridge.extractHomeserverOrigin(invitee.rawInviteeId, internalHomeServerDomain),
					internalHomeServerDomain,
				),
		);
		if (invitees.length === 0 || inviteComesFromAnExternalHomeServer || !atLeastOneExternalUser) {
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

	public async createInternalLocalDirectMessageRoom(dmRoomCreateInput: FederationCreateDirectMessageDto): Promise<void> {
		const { internalInviterId, invitees } = dmRoomCreateInput;

		await this.internalRoomAdapter.createLocalDirectMessageRoom(invitees, internalInviterId);
	}

	private async createExternalDirectMessageRoomAndInviteUsers(
		dmRoomOnCreationInput: FederationOnDirectMessageRoomCreationDto,
	): Promise<void> {
		const { internalRoomId, internalInviterId, invitees } = dmRoomOnCreationInput;
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();

		const inviterUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId);
		if (!inviterUser) {
			const internalUser = await this.internalUserAdapter.getInternalUserById(internalInviterId);
			const username = internalUser.username || internalInviterId;
			const name = internalUser.name || internalInviterId;
			const existsOnlyOnProxyServer = true;
			const externalInviterId = await this.bridge.createUser(username, name, internalHomeServerDomain);

			await this.createFederatedUserInternallyOnly(externalInviterId, username, existsOnlyOnProxyServer, name);
		}

		const federatedInviterUser = inviterUser || (await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId));
		if (!federatedInviterUser) {
			throw new Error(`User with internalId ${internalInviterId} not found`);
		}

		const isInviterFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedInviterUser.getExternalId(), internalHomeServerDomain),
			internalHomeServerDomain,
		);
		const internalFederatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);

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

		if (internalFederatedRoom || !isInviterFromTheSameHomeServer) {
			return;
		}

		const allInviteeExternalIds = invitees.map((invitee) => invitee.rawInviteeId);
		const externalRoomId = await this.bridge.createDirectMessageRoom(federatedInviterUser.getExternalId(), allInviteeExternalIds, {
			internalRoomId,
		});
		const inviteesFromTheSameHomeServer = invitees.filter((invitee) =>
			FederatedUser.isOriginalFromTheProxyServer(
				this.bridge.extractHomeserverOrigin(invitee.rawInviteeId, internalHomeServerDomain),
				internalHomeServerDomain,
			),
		);
		await Promise.all(inviteesFromTheSameHomeServer.map((invitee) => this.bridge.joinRoom(externalRoomId, invitee.rawInviteeId)));
		await this.internalRoomAdapter.updateFederatedRoomByInternalRoomId(internalRoomId, externalRoomId);
	}

	private async createUserForDirectMessageRoom(roomInviteUserInput: FederationRoomInviteUserDto): Promise<void> {
		const { normalizedInviteeId, inviteeUsernameOnly, rawInviteeId } = roomInviteUserInput;

		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isInviteeFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(rawInviteeId, internalHomeServerDomain),
			internalHomeServerDomain,
		);

		const username = isInviteeFromTheSameHomeServer ? inviteeUsernameOnly : normalizedInviteeId;
		const existsOnlyOnProxyServer = isInviteeFromTheSameHomeServer;
		const inviteeUser = await this.internalUserAdapter.getFederatedUserByInternalUsername(username);
		if (!inviteeUser) {
			await this.createFederatedUserInternallyOnly(rawInviteeId, username, existsOnlyOnProxyServer);
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
			internalHomeServerDomain,
		);
	}
}
