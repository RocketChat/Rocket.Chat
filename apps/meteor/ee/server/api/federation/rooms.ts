import { FederationEE } from '@rocket.chat/core-services';
import {
	isFederationAddServerProps,
	isFederationRemoveServerProps,
	isFederationSearchPublicRoomsProps,
	isFederationJoinExternalPublicRoomProps,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../app/api/server';
import { getPaginationItems } from '../../../../app/api/server/helpers/getPaginationItems';

API.v1.addRoute(
	'federation/searchPublicRooms',
	{
		authRequired: true,
		validateParams: isFederationSearchPublicRoomsProps,
		license: ['federation'],
	},
	{
		async get() {
			const { count } = await getPaginationItems(this.queryParams);
			const { serverName, roomName, pageToken } = this.queryParams;

			const result = await FederationEE.searchPublicRooms(serverName, roomName, pageToken, count);

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'federation/listServersByUser',
	{
		authRequired: true,
		license: ['federation'],
	},
	{
		async get() {
			const servers = await FederationEE.getSearchedServerNamesByInternalUserId(this.userId);

			return API.v1.success({
				servers,
			});
		},
	},
);

API.v1.addRoute(
	'federation/addServerByUser',
	{
		authRequired: true,
		validateParams: isFederationAddServerProps,
		license: ['federation'],
	},
	{
		async post() {
			const { serverName } = this.bodyParams;

			await FederationEE.addSearchedServerNameByInternalUserId(this.userId, serverName);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'federation/removeServerByUser',
	{
		authRequired: true,
		validateParams: isFederationRemoveServerProps,
		license: ['federation'],
	},
	{
		async post() {
			const { serverName } = this.bodyParams;

			await FederationEE.removeSearchedServerNameByInternalUserId(this.userId, serverName);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'federation/joinExternalPublicRoom',
	{
		authRequired: true,
		validateParams: isFederationJoinExternalPublicRoomProps,
		license: ['federation'],
	},
	{
		async post() {
			const { externalRoomId, roomName, pageToken } = this.bodyParams;

			await FederationEE.scheduleJoinExternalPublicRoom(this.userId, externalRoomId, roomName, decodeURIComponent(pageToken || ''));

			return API.v1.success();
		},
	},
);
