import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { FederationPaginatedResult, IFederationPublicRooms } from '@rocket.chat/rest-typings';
import { MatrixRoomJoinRules } from '../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixRoomJoinRules';
import { RocketChatFileAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/File';
import { RocketChatNotificationAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Notification';
import { RocketChatSettingsAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { FederatedRoomEE } from '../domain/FederatedRoom';
import { IFederationBridgeEE, IFederationPublicRoomsResult } from '../domain/IFederationBridge';
import { RocketChatMessageAdapterEE } from '../infrastructure/rocket-chat/adapters/Message';
import { RocketChatRoomAdapterEE } from '../infrastructure/rocket-chat/adapters/Room';
import { RocketChatUserAdapterEE } from '../infrastructure/rocket-chat/adapters/User';
import { FederationJoinPublicRoomInputDto, FederationSearchPublicRoomsInputDto } from './input/RoomInputDto';
import { FederationServiceEE } from './sender/AbstractFederationService';

export class FederationRoomApplicationServiceEE extends FederationServiceEE {

    constructor(
        protected readonly internalSettingsAdapter: RocketChatSettingsAdapter,
        protected readonly internalFileAdapter: RocketChatFileAdapter,
        protected readonly internalUserAdapter: RocketChatUserAdapterEE,
        protected readonly internalRoomAdapter: RocketChatRoomAdapterEE,
        protected readonly internalNotificationAdapter: RocketChatNotificationAdapter,
        protected readonly internalMessageAdapter: RocketChatMessageAdapterEE,
        protected readonly bridge: IFederationBridgeEE,
    ) {
        super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
    }

    public async searchPublicRooms(roomSearchInputDto: FederationSearchPublicRoomsInputDto): Promise<FederationPaginatedResult<{
        rooms: IFederationPublicRooms[];
    }>> {
        if (!this.internalSettingsAdapter.isFederationEnabled()) {
            throw new Error('Federation is disabled');
        }
        console.log({ a: this.internalSettingsAdapter.getHomeServerDomain() })

        const { serverName, roomName, count, pageToken } = roomSearchInputDto;
        const rooms = await this.bridge.searchPublicRooms({
            serverName: serverName || this.internalSettingsAdapter.getHomeServerDomain(),
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

        const { externalRoomId, internalUserId, externalRoomName, normalizedRoomId } = joinPublicRoomInputDto;
        const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);

        if (!federatedUser) {
            await this.createFederatedUserIncludingHomeserverUsingLocalInformation(internalUserId);
        }

        const federatedInviterUser = federatedUser || (await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId));
        if (!federatedInviterUser) {
            throw new Error(`User with internalId ${ internalUserId } not found`);
        }

        const room = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
        let internalRoomId;
        let wasCreated = false;
        if (!room) {
            const newFederatedRoom = FederatedRoomEE.createInstance(
                externalRoomId,
                normalizedRoomId,
                federatedInviterUser,
                RoomType.CHANNEL,
                externalRoomName,
            );

            internalRoomId = await this.internalRoomAdapter.createFederatedRoom(newFederatedRoom);
            wasCreated = true;
        }
        const federatedRoom = room || (await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId));
        if (!federatedRoom) {
            throw new Error('Federated room not found');
        }
        await this.bridge.joinRoom(externalRoomId, federatedInviterUser.getExternalId());
        await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
            (internalRoomId || federatedRoom?.getInternalId()),
            this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
        );
        await this.internalRoomAdapter.addUserToRoom(federatedRoom, federatedInviterUser);
        if (wasCreated) {
            await this.internalMessageAdapter.sendJoinedRoomMessage(federatedRoom.getInternalId(), federatedInviterUser);
        }
    }
}

class RoomMapper {
    public static toSearchPublicRoomsDto(rooms: IFederationPublicRoomsResult): FederationPaginatedResult<{
        rooms: IFederationPublicRooms[];
    }> {
        return {
            rooms: rooms.chunk.map((room) => ({
                id: room.room_id,
                name: room.name,
                canJoin: !(room.join_rule && room.join_rule === MatrixRoomJoinRules.KNOCK),
                canonicalAlias: room.canonical_alias,
                joinedMembers: room.num_joined_members,
                topic: room.topic,
            })),
            count: rooms.chunk.length,
            ...(rooms.next_batch ? { nextPageToken: rooms.next_batch } : {}),
            ...(rooms.prev_batch ? { prevPageToken: rooms.prev_batch } : {}),
            total: rooms.total_room_count_estimate,
        }
    }
}