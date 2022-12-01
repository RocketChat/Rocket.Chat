import type { FederationPaginatedResult, IFederationPublicRooms } from '@rocket.chat/rest-typings';

import { MatrixRoomJoinRules } from '../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixRoomJoinRules';
import type { RocketChatFileAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/File';
import type { RocketChatSettingsAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import type { IFederationBridgeEE, IFederationPublicRoomsResult } from '../domain/IFederationBridge';
import type { RocketChatUserAdapterEE } from '../infrastructure/rocket-chat/adapters/User';
import type { FederationJoinPublicRoomInputDto, FederationSearchPublicRoomsInputDto } from './input/RoomInputDto';
import { FederationServiceEE } from './sender/AbstractFederationService';

export class FederationRoomApplicationServiceEE extends FederationServiceEE {
	constructor(
		protected readonly internalSettingsAdapter: RocketChatSettingsAdapter,
		protected readonly internalFileAdapter: RocketChatFileAdapter,
		protected readonly internalUserAdapter: RocketChatUserAdapterEE,
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

		const { externalRoomId, internalUserId } = joinPublicRoomInputDto;
		const user = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!user) {
			await this.createFederatedUserIncludingHomeserverUsingLocalInformation(internalUserId);
		}

		const federatedUser = user || (await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId));
		if (!federatedUser) {
			throw new Error(`User with internalId ${internalUserId} not found`);
		}

		await this.bridge.joinRoom(externalRoomId, federatedUser.getExternalId());
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
