import type { FederationPaginatedResult, IFederationPublicRooms } from '@rocket.chat/rest-typings';

import { MatrixRoomJoinRules } from '../../../../../../../server/services/federation/infrastructure/matrix/definitions/MatrixRoomJoinRules';
import type { RocketChatFileAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Message';
import type { RocketChatNotificationAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Notification';
import type { RocketChatSettingsAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Settings';
import { ROCKET_CHAT_FEDERATION_ROLES } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/definitions/FederatedRoomInternalRoles';
import { FederatedUserEE } from '../../../domain/FederatedUser';
import type { IFederationBridgeEE, IFederationPublicRoomsResult } from '../../../domain/IFederationBridge';
import type { RocketChatQueueAdapterEE } from '../../../infrastructure/rocket-chat/adapters/Queue';
import type { RocketChatRoomAdapterEE } from '../../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatUserAdapterEE } from '../../../infrastructure/rocket-chat/adapters/User';
import { AbstractFederationApplicationServiceEE } from '../../AbstractFederationApplicationServiceEE';
import type { FederationJoinExternalPublicRoomInputDto, FederationSearchPublicRoomsInputDto } from './input/RoomInputDto';
import type {
	FederationBeforeAddUserToARoomDto,
	FederationOnRoomCreationDto,
	FederationOnUsersAddedToARoomDto,
	FederationRoomInviteUserDto,
	FederationSetupRoomDto,
	IFederationInviteeDto,
} from './input/RoomSenderDto';

export class FederationRoomServiceSender extends AbstractFederationApplicationServiceEE {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapterEE,
		protected internalUserAdapter: RocketChatUserAdapterEE,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected internalMessageAdapter: RocketChatMessageAdapter,
		protected internalNotificationAdapter: RocketChatNotificationAdapter,
		protected internalQueueAdapter: RocketChatQueueAdapterEE,
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

	public async searchPublicRooms(roomSearchInputDto: FederationSearchPublicRoomsInputDto): Promise<
		FederationPaginatedResult<{
			rooms: IFederationPublicRooms[];
		}>
	> {
		if (!this.internalSettingsAdapter.isFederationEnabled()) {
			throw new Error('Federation is disabled');
		}

		const { serverName, roomName, count, pageToken } = roomSearchInputDto;
		const rooms = await this.bridge.searchPublicRooms({
			serverName: serverName || this.internalHomeServerDomain,
			roomName,
			limit: count,
			pageToken,
		});

		return RoomMapper.toSearchPublicRoomsDto(
			rooms,
			parseInt(this.internalSettingsAdapter.getMaximumSizeOfUsersWhenJoiningPublicRooms() || '0'),
			pageToken,
		);
	}

	public async scheduleJoinExternalPublicRoom(
		internalUserId: string,
		externalRoomId: string,
		roomName?: string,
		pageToken?: string,
	): Promise<void> {
		if (!this.internalSettingsAdapter.isFederationEnabled()) {
			throw new Error('Federation is disabled');
		}
		await this.internalQueueAdapter.enqueueJob('federation-enterprise.joinExternalPublicRoom', {
			internalUserId,
			externalRoomId,
			roomName,
			pageToken,
		});
	}

	public async joinExternalPublicRoom(joinExternalPublicRoomInputDto: FederationJoinExternalPublicRoomInputDto): Promise<void> {
		if (!this.internalSettingsAdapter.isFederationEnabled()) {
			throw new Error('Federation is disabled');
		}

		const { externalRoomId, internalUserId, externalRoomHomeServerName, roomName, pageToken } = joinExternalPublicRoomInputDto;
		const room = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (room) {
			const alreadyJoined = await this.internalRoomAdapter.isUserAlreadyJoined(room.getInternalId(), internalUserId);
			if (alreadyJoined) {
				throw new Error('already-joined');
			}
		}

		const user = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!user) {
			await this.createFederatedUserIncludingHomeserverUsingLocalInformation(internalUserId);
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			throw new Error(`User with internalId ${internalUserId} not found`);
		}
		if (!(await this.isRoomSizeAllowed(externalRoomId, externalRoomHomeServerName, roomName, pageToken))) {
			throw new Error("Can't join a room bigger than the admin of your workspace has set as the maximum size");
		}

		await this.bridge.joinRoom(externalRoomId, federatedUser.getExternalId(), [externalRoomHomeServerName]);
	}

	private async isRoomSizeAllowed(externalRoomId: string, serverName: string, roomName?: string, pageToken?: string): Promise<boolean> {
		try {
			const rooms = await this.bridge.searchPublicRooms({
				serverName,
				limit: 50,
				roomName,
				pageToken,
			});

			const room = rooms.chunk.find((room) => room.room_id === externalRoomId);
			if (!room) {
				throw new Error("Cannot find the room you're trying to join");
			}
			return room.num_joined_members <= parseInt(this.internalSettingsAdapter.getMaximumSizeOfUsersWhenJoiningPublicRooms() || '0');
		} catch (error) {
			throw new Error("Cannot find the room you're trying to join");
		}
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

		if (isUserAutoJoining && !isInviteeFromTheSameHomeServer) {
			return;
		}

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

class RoomMapper {
	public static toSearchPublicRoomsDto(
		rooms: IFederationPublicRoomsResult,
		maxSizeOfUsersAllowed: number,
		pageToken?: string,
	): FederationPaginatedResult<{
		rooms: IFederationPublicRooms[];
	}> {
		return {
			rooms: (rooms?.chunk || [])
				.filter((room) => room.join_rule && room.join_rule !== MatrixRoomJoinRules.KNOCK)
				.map((room) => ({
					id: room.room_id,
					name: room.name,
					canJoin: room.num_joined_members <= maxSizeOfUsersAllowed,
					canonicalAlias: room.canonical_alias,
					joinedMembers: room.num_joined_members,
					topic: room.topic,
					pageToken,
				})),
			count: rooms?.chunk?.length || 0,
			total: rooms?.total_room_count_estimate || 0,
			...(rooms?.next_batch ? { nextPageToken: rooms.next_batch } : {}),
			...(rooms?.prev_batch ? { prevPageToken: rooms.prev_batch } : {}),
		};
	}
}
