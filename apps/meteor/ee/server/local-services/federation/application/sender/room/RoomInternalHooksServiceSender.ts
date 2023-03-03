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
import { FederationApplicationServiceEE } from '../AbstractFederationService';
import type { RocketChatFileAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/File';
import type { RocketChatSettingsAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatMessageAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Message';
import { ROCKET_CHAT_FEDERATION_ROLES } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/definitions/InternalFederatedRoomRoles';

export class FederationRoomInternalHooksServiceSender extends FederationApplicationServiceEE {
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
		const { invitees = [], internalInviter, internalRoomId } = dmBeforeAddUserToARoomInput;
		if (invitees.length === 0) {
			return;
		}
		if (internalInviter) {
			const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviter._id);
			if (!federatedUser) {
				return;
			}

			const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
			if (!federatedRoom) {
				return;
			}
			const userRolesInThisRoom = await this.internalRoomAdapter.getInternalRoomRolesByUserId(
				federatedRoom.getInternalId(),
				federatedUser.getInternalId(),
			);
			const canAddUserToARoom =
				userRolesInThisRoom.includes(ROCKET_CHAT_FEDERATION_ROLES.OWNER) ||
				userRolesInThisRoom.includes(ROCKET_CHAT_FEDERATION_ROLES.MODERATOR) ||
				federatedRoom.isTheCreator(federatedUser.getInternalId());
			if (!canAddUserToARoom) {
				throw new Error('You are not allowed to add users to this room');
			}
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
