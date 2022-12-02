import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import type { FederationPaginatedResult, IFederationPublicRooms } from '@rocket.chat/rest-typings';

import { MatrixRoomJoinRules } from '../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixRoomJoinRules';
import type { RocketChatFileAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/File';
import type { RocketChatNotificationAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Notification';
import type { RocketChatSettingsAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { FederatedRoomEE } from '../domain/FederatedRoom';
import type { IFederationBridgeEE, IFederationPublicRoomsResult } from '../domain/IFederationBridge';
import type { RocketChatRoomAdapterEE } from '../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatUserAdapterEE } from '../infrastructure/rocket-chat/adapters/User';
import type { FederationJoinPublicRoomInputDto, FederationSearchPublicRoomsInputDto } from './input/RoomInputDto';
import { FederationServiceEE } from './sender/AbstractFederationService';

export class FederationRoomApplicationServiceEE extends FederationServiceEE {
	constructor(
		protected readonly internalSettingsAdapter: RocketChatSettingsAdapter,
		protected readonly internalFileAdapter: RocketChatFileAdapter,
		protected readonly internalUserAdapter: RocketChatUserAdapterEE,
		protected readonly internalRoomAdapter: RocketChatRoomAdapterEE,
		protected readonly internalNotificationAdapter: RocketChatNotificationAdapter,
		protected readonly bridge: IFederationBridgeEE,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
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

		return RoomMapper.toSearchPublicRoomsDto(rooms);
	}

	public async joinPublicRoom(joinPublicRoomInputDto: FederationJoinPublicRoomInputDto): Promise<void> {
		if (!this.internalSettingsAdapter.isFederationEnabled()) {
			throw new Error('Federation is disabled');
		}

		const { externalRoomId, internalUserId, normalizedRoomId, externalRoomHomeServerName } = joinPublicRoomInputDto;
		const user = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!user) {
			await this.createFederatedUserIncludingHomeserverUsingLocalInformation(internalUserId);
		}

		const federatedUser = user || (await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId));
		if (!federatedUser) {
			throw new Error(`User with internalId ${internalUserId} not found`);
		}
		await this.bridge.joinRoom(externalRoomId, federatedUser.getExternalId(), [externalRoomHomeServerName]);

		const externalRoomData = await this.bridge.getRoomData(federatedUser.getExternalId(), externalRoomId);
		if (!externalRoomData) {
			return;
		}
		const creatorUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalRoomData.creator.id);
		if (!creatorUser) {
			await this.createFederatedUserInternallyOnly(externalRoomData.creator.id, externalRoomData.creator.username, false);
		}
		const federatedCreatorUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalRoomData.creator.id);
		if (!federatedCreatorUser) {
			return;
		}
		const room = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		let internalRoomId;
		if (!room) {
			const newFederatedRoom = FederatedRoomEE.createInstance(
				externalRoomId,
				normalizedRoomId,
				federatedCreatorUser,
				RoomType.CHANNEL,
				externalRoomData.name,
			);
			internalRoomId = await this.internalRoomAdapter.createFederatedRoom(newFederatedRoom);
		}

		const federatedRoom = room || (await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId));
		if (!federatedRoom) {
			return;
		}
		await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
			internalRoomId || federatedRoom.getInternalId(),
			this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
		);
		await this.internalRoomAdapter.addUserToRoom(federatedRoom, federatedUser);
	}
}

class RoomMapper {
	public static toSearchPublicRoomsDto(rooms: IFederationPublicRoomsResult): FederationPaginatedResult<{
		rooms: IFederationPublicRooms[];
	}> {
		return {
			rooms: (rooms?.chunk || []).map((room) => ({
				id: room.room_id,
				name: room.name,
				canJoin: !(room.join_rule && room.join_rule === MatrixRoomJoinRules.KNOCK),
				canonicalAlias: room.canonical_alias,
				joinedMembers: room.num_joined_members,
				topic: room.topic,
			})),
			count: rooms.chunk.length,
			total: rooms.total_room_count_estimate,
			...(rooms.next_batch ? { nextPageToken: rooms.next_batch } : {}),
			...(rooms.prev_batch ? { prevPageToken: rooms.prev_batch } : {}),
		};
	}
}
