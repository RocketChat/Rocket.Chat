import type { RocketChatFileAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Message';
import type { RocketChatSettingsAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { FederatedRoomEE } from '../../../domain/FederatedRoom';
import { FederatedUserEE } from '../../../domain/FederatedUser';
import type { IFederationBridgeEE } from '../../../domain/IFederationBridge';
import type { RocketChatRoomAdapterEE } from '../../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatUserAdapterEE } from '../../../infrastructure/rocket-chat/adapters/User';
import type {
	FederationBeforeAddUserToARoomDto,
	FederationOnRoomCreationDto,
	FederationOnUsersAddedToARoomDto,
	FederationRoomInviteUserDto,
	FederationSetupRoomDto,
	IFederationInviteeDto,
} from '../input/RoomSenderDto';
import { FederationServiceEE } from '../AbstractFederationService';

export class FederationRoomInternalHooksServiceSender extends FederationServiceEE {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapterEE,
		protected internalUserAdapter: RocketChatUserAdapterEE,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected internalMessageAdapter: RocketChatMessageAdapter,
		protected bridge: IFederationBridgeEE,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	public async onRoomCreated(roomOnCreationInput: FederationOnRoomCreationDto): Promise<void> {
		const { internalInviterId, internalRoomId, invitees } = roomOnCreationInput;
		await this.setupFederatedRoom({ internalInviterId, internalRoomId });

		if (invitees.length === 0) {
			return;
		}

		await this.inviteLocalThenExternalUsers(invitees, internalInviterId, internalRoomId);
	}

	public async beforeAddUserToARoom(dmBeforeAddUserToARoomInput: FederationBeforeAddUserToARoomDto): Promise<void> {
		const { invitees = [] } = dmBeforeAddUserToARoomInput;
		if (invitees.length === 0) {
			return;
		}

		await this.createUsersLocallyOnly(invitees);
	}

	private async inviteLocalThenExternalUsers(
		invitees: IFederationInviteeDto[],
		internalInviterId: string,
		internalRoomId: string,
	): Promise<void> {
		const localUsers = invitees.filter((user) =>
			FederatedUserEE.isOriginalFromTheProxyServer(this.bridge.extractHomeserverOrigin(user.rawInviteeId), this.internalHomeServerDomain),
		);

		const externalUsers = invitees.filter(
			(user) =>
				!FederatedUserEE.isOriginalFromTheProxyServer(
					this.bridge.extractHomeserverOrigin(user.rawInviteeId),
					this.internalHomeServerDomain,
				),
		);

		for await (const user of [...localUsers, ...externalUsers]) {
			await this.inviteUserToAFederatedRoom({
				internalInviterId,
				internalRoomId,
				inviteeUsernameOnly: user.inviteeUsernameOnly,
				normalizedInviteeId: user.normalizedInviteeId,
				rawInviteeId: user.rawInviteeId,
			});
		}
	}

	public async onUsersAddedToARoom(roomOnUsersAddedToARoomInput: FederationOnUsersAddedToARoomDto): Promise<void> {
		const { internalInviterId, internalRoomId, invitees, inviteComesFromAnExternalHomeServer } = roomOnUsersAddedToARoomInput;

		if (inviteComesFromAnExternalHomeServer) {
			return;
		}

		await this.inviteLocalThenExternalUsers(invitees, internalInviterId, internalRoomId);
	}

	public async afterRoomNameChanged(internalRoomId: string, internalRoomName: string): Promise<void> {
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser =
			federatedRoom.getCreatorId() && (await this.internalUserAdapter.getFederatedUserByInternalId(federatedRoom.getCreatorId() as string));
		if (!federatedUser) {
			return;
		}

		const isRoomFromTheSameHomeServer = FederatedRoomEE.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedRoom.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
		);
		if (!isRoomFromTheSameHomeServer) {
			return;
		}

		const externalRoomName = await this.bridge.getRoomName(federatedRoom.getExternalId(), federatedUser.getExternalId());

		if (!federatedRoom.shouldUpdateDisplayRoomName(externalRoomName || '')) {
			return;
		}

		await this.bridge.setRoomName(federatedRoom.getExternalId(), federatedUser.getExternalId(), internalRoomName);
	}

	public async afterRoomTopicChanged(internalRoomId: string, internalRoomTopic: string): Promise<void> {
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser =
			federatedRoom.getCreatorId() && (await this.internalUserAdapter.getFederatedUserByInternalId(federatedRoom.getCreatorId() as string));
		if (!federatedUser) {
			return;
		}

		const isRoomFromTheSameHomeServer = FederatedRoomEE.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedRoom.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
		);
		if (!isRoomFromTheSameHomeServer) {
			return;
		}

		const externalRoomTopic = await this.bridge.getRoomTopic(federatedRoom.getExternalId(), federatedUser.getExternalId());
		if (!federatedRoom.shouldUpdateRoomTopic(externalRoomTopic || '')) {
			return;
		}

		await this.bridge.setRoomTopic(federatedRoom.getExternalId(), federatedUser.getExternalId(), internalRoomTopic);
	}

	private async setupFederatedRoom(roomInviteUserInput: FederationSetupRoomDto): Promise<void> {
		const { internalInviterId, internalRoomId } = roomInviteUserInput;
		const inviterUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId);
		if (!inviterUser) {
			await this.createFederatedUserIncludingHomeserverUsingLocalInformation(internalInviterId);
		}

		const federatedInviterUser = inviterUser || (await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId));
		if (!federatedInviterUser) {
			throw new Error(`User with internalId ${internalInviterId} not found`);
		}

		const internalFederatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (internalFederatedRoom) {
			return;
		}
		const internalRoom = await this.internalRoomAdapter.getInternalRoomById(internalRoomId);
		if (!internalRoom || !internalRoom.name) {
			throw new Error(`Room with internalId ${internalRoomId} not found`);
		}
		const roomName = internalRoom.fname || internalRoom.name;
		const externalRoomId = await this.bridge.createRoom(federatedInviterUser.getExternalId(), internalRoom.t, roomName, internalRoom.topic);

		await this.internalRoomAdapter.updateFederatedRoomByInternalRoomId(internalRoom._id, externalRoomId);
	}

	private async inviteUserToAFederatedRoom(roomInviteUserInput: FederationRoomInviteUserDto): Promise<void> {
		const { internalInviterId, internalRoomId, normalizedInviteeId, inviteeUsernameOnly, rawInviteeId } = roomInviteUserInput;
		const isUserAutoJoining = Boolean(!internalInviterId);

		const isInviteeFromTheSameHomeServer = FederatedUserEE.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(rawInviteeId),
			this.internalHomeServerDomain,
		);

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			throw new Error(`Could not find the room to invite. RoomId: ${internalRoomId}`);
		}

		const federatedInviterUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId);
		if (!federatedInviterUser && !isUserAutoJoining) {
			throw new Error(`User with internalId ${internalInviterId} not found`);
		}

		const username = isInviteeFromTheSameHomeServer ? inviteeUsernameOnly : normalizedInviteeId;
		const inviteeUser = await this.internalUserAdapter.getFederatedUserByInternalUsername(username);
		if (!inviteeUser) {
			const existsOnlyOnProxyServer = isInviteeFromTheSameHomeServer;
			await this.createFederatedUserInternallyOnly(rawInviteeId, username, existsOnlyOnProxyServer);
		}

		const federatedInviteeUser = inviteeUser || (await this.internalUserAdapter.getFederatedUserByInternalUsername(username));
		if (!federatedInviteeUser) {
			throw new Error(`User with internalUsername ${username} not found`);
		}

		if (isInviteeFromTheSameHomeServer) {
			const profile = await this.bridge.getUserProfileInformation(federatedInviteeUser.getExternalId());
			if (!profile) {
				await this.bridge.createUser(
					inviteeUsernameOnly,
					federatedInviteeUser.getName() || federatedInviteeUser.getUsername() || username,
					this.internalHomeServerDomain,
				);
			}
		}

		if (!federatedInviterUser && isUserAutoJoining) {
			await this.bridge.joinRoom(federatedRoom.getExternalId(), federatedInviteeUser.getExternalId());
			return;
		}

		if (!federatedInviterUser) {
			throw new Error(`User with internalId ${internalInviterId} not found`);
		}

		await this.bridge.inviteToRoom(
			federatedRoom.getExternalId(),
			federatedInviterUser.getExternalId(),
			federatedInviteeUser.getExternalId(),
		);
		if (isInviteeFromTheSameHomeServer) {
			await this.bridge.joinRoom(federatedRoom.getExternalId(), federatedInviteeUser.getExternalId());
		}
	}
}
