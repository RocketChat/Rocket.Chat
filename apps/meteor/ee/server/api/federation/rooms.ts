import { federationRoomApplicationServiceEE } from '../../../app/federation-v2/server';
import { API } from '../../../../app/api/server';
import { FederationJoinPublicRoomInputDto, FederationSearchPublicRoomsInputDto } from '../../../app/federation-v2/server/application/input/RoomInputDto';
import { isFederationJoinPublicRoomProps, isFederationSearchPublicRoomsProps } from '@rocket.chat/rest-typings';
import { FederationRoomSenderConverter } from '../../../../app/federation-v2/server/infrastructure/rocket-chat/converters/RoomSender';
import { FederationRoomSenderConverterEE } from '../../../app/federation-v2/server/infrastructure/rocket-chat/converters/RoomSender';

require('util').inspect.defaultOptions.depth = null;

API.v1.addRoute(
    'federation/searchPublicRooms',
    {
        authRequired: true,
        validateParams: isFederationSearchPublicRoomsProps,
    },
    {
        async get() {
            const { count } = this.getPaginationItems();
            const { serverName, roomName, pageToken } = this.queryParams;

            const result = await federationRoomApplicationServiceEE.searchPublicRooms(
                new FederationSearchPublicRoomsInputDto({
                    serverName,
                    roomName,
                    pageToken,
                    count,
                }));

            return API.v1.success(result);
        },
    },
);

API.v1.addRoute(
    'federation/joinPublicRoom',
    {
        authRequired: true,
        validateParams: isFederationJoinPublicRoomProps,
    },
    {
        async post() {
            const { externalRoomId, externalRoomName } = this.bodyParams;

            await federationRoomApplicationServiceEE.joinPublicRoom(FederationRoomSenderConverterEE.toJoinPublicRoomDto(this.userId, externalRoomId, externalRoomName));

            return API.v1.success();
        },
    },
);
