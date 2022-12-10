import {
	isFederationAddServerProps,
	isFederationJoinPublicRoomProps,
	isFederationRemoveServerProps,
	isFederationSearchPublicRoomsProps,
} from '@rocket.chat/rest-typings';

import { federationRoomApplicationServiceEE } from '../../../app/federation-v2/server';
import { API } from '../../../../app/api/server';
import { FederationSearchPublicRoomsInputDto } from '../../../app/federation-v2/server/application/input/RoomInputDto';
import { FederationRoomSenderConverterEE } from '../../../app/federation-v2/server/infrastructure/rocket-chat/converters/RoomSender';

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
				}),
			);

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'federation/listServersByUser',
	{
		authRequired: true,
	},
	{
		async get() {
			const result = await federationRoomApplicationServiceEE.getSearchedServerNamesByInternalUserId(this.userId);

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'federation/addServerByUser',
	{
		authRequired: true,
		validateParams: isFederationAddServerProps,
	},
	{
		async post() {
			const { serverName } = this.bodyParams;

			await federationRoomApplicationServiceEE.addSearchedServerNameByInternalUserId(this.userId, serverName);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'federation/removeServerByUser',
	{
		authRequired: true,
		validateParams: isFederationRemoveServerProps,
	},
	{
		async post() {
			const { serverName } = this.bodyParams;

			await federationRoomApplicationServiceEE.removeSearchedServerNameByInternalUserId(this.userId, serverName);

			return API.v1.success();
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
			const { externalRoomId } = this.bodyParams;

			await federationRoomApplicationServiceEE.joinPublicRoom(
				FederationRoomSenderConverterEE.toJoinPublicRoomDto(this.userId, externalRoomId),
			);

			return API.v1.success();
		},
	},
);
