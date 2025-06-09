import { HomeserverEE } from '@rocket.chat/core-services';
import type { IHomeserverServiceEE } from '@rocket.chat/core-services';

import { API } from '../../../../app/api/server';

// Matrix Federation endpoints
API.v1.addRoute(
	'_matrix/federation/v1/version',
	{
		authRequired: false,
		license: ['federation'],
	},
	{
		async get() {
			return API.v1.success({
				server: {
					name: 'Rocket.Chat Native Federation',
					version: '1.0.0',
				},
			});
		},
	},
);

API.v1.addRoute(
	'_matrix/federation/v1/query/profile',
	{
		authRequired: false,
		license: ['federation'],
	},
	{
		async get() {
			const userId = this.queryParams.user_id;
			
			if (!userId) {
				return API.v1.failure('Missing user_id parameter', 'missing-parameter');
			}

			try {
				const profile = await (HomeserverEE as IHomeserverServiceEE).getUserProfile(userId);
				return API.v1.success(profile);
			} catch (error) {
				return API.v1.failure(error.message);
			}
		},
	},
);

API.v1.addRoute(
	'_matrix/federation/v1/send/:txnId',
	{
		authRequired: false,
		license: ['federation'],
	},
	{
		async post() {
			const txnId = this.urlParams.txnId;
			const { pdus, edus } = this.bodyParams;

			try {
				await (HomeserverEE as IHomeserverServiceEE).sendFederationTransaction(txnId, pdus, edus);
				return API.v1.success({ success: true });
			} catch (error) {
				return API.v1.failure(error.message);
			}
		},
	},
);

API.v1.addRoute(
	'_matrix/federation/v1/make_join/:roomId/:userId',
	{
		authRequired: false,
		license: ['federation'],
	},
	{
		async get() {
			const { roomId, userId } = this.urlParams;

			try {
				const joinEvent = await (HomeserverEE as IHomeserverServiceEE).makeJoin(roomId, userId);
				return API.v1.success(joinEvent);
			} catch (error) {
				return API.v1.failure(error.message, 'forbidden');
			}
		},
	},
);

API.v1.addRoute(
	'_matrix/federation/v1/send_join/:roomId/:eventId',
	{
		authRequired: false,
		license: ['federation'],
	},
	{
		async post() {
			const { roomId, eventId } = this.urlParams;
			const event = this.bodyParams;

			try {
				const result = await (HomeserverEE as IHomeserverServiceEE).sendJoin(roomId, eventId, event);
				return API.v1.success(result);
			} catch (error) {
				return API.v1.failure(error.message);
			}
		},
	},
);

API.v1.addRoute(
	'_matrix/federation/v1/state/:roomId',
	{
		authRequired: false,
		license: ['federation'],
	},
	{
		async get() {
			const { roomId } = this.urlParams;
			const eventId = this.queryParams.event_id;

			try {
				const state = await (HomeserverEE as IHomeserverServiceEE).getRoomState(roomId, eventId);
				return API.v1.success(state);
			} catch (error) {
				return API.v1.failure(error.message, 'not-found');
			}
		},
	},
);

API.v1.addRoute(
	'_matrix/federation/v1/state_ids/:roomId',
	{
		authRequired: false,
		license: ['federation'],
	},
	{
		async get() {
			const { roomId } = this.urlParams;
			const eventId = this.queryParams.event_id;

			try {
				const stateIds = await (HomeserverEE as IHomeserverServiceEE).getRoomStateIds(roomId, eventId);
				return API.v1.success(stateIds);
			} catch (error) {
				return API.v1.failure(error.message, 'not-found');
			}
		},
	},
);

API.v1.addRoute(
	'_matrix/federation/v1/user/keys/query',
	{
		authRequired: false,
		license: ['federation'],
	},
	{
		async post() {
			const { device_keys } = this.bodyParams;

			try {
				const keys = await (HomeserverEE as IHomeserverServiceEE).queryKeys(device_keys);
				return API.v1.success(keys);
			} catch (error) {
				return API.v1.failure(error.message);
			}
		},
	},
);

// Internal Rocket.Chat API endpoints for homeserver integration
API.v1.addRoute(
	'federation/homeserver/send',
	{
		authRequired: true,
		license: ['federation'],
	},
	{
		async post() {
			const { roomId, event } = this.bodyParams;
			
			try {
				await (HomeserverEE as IHomeserverServiceEE).sendEvent(roomId, event);
				return API.v1.success({ success: true });
			} catch (error) {
				return API.v1.failure(error.message);
			}
		},
	},
);

API.v1.addRoute(
	'federation/homeserver/join',
	{
		authRequired: true,
		license: ['federation'],
	},
	{
		async post() {
			const { roomId, serverName } = this.bodyParams;
			
			try {
				await (HomeserverEE as IHomeserverServiceEE).joinRoom(roomId, serverName);
				return API.v1.success({ success: true });
			} catch (error) {
				return API.v1.failure(error.message);
			}
		},
	},
);

API.v1.addRoute(
	'federation/homeserver/leave',
	{
		authRequired: true,
		license: ['federation'],
	},
	{
		async post() {
			const { roomId } = this.bodyParams;
			
			try {
				await (HomeserverEE as IHomeserverServiceEE).leaveRoom(roomId);
				return API.v1.success({ success: true });
			} catch (error) {
				return API.v1.failure(error.message);
			}
		},
	},
);

API.v1.addRoute(
	'federation/homeserver/invite',
	{
		authRequired: true,
		license: ['federation'],
	},
	{
		async post() {
			const { userId, roomId } = this.bodyParams;
			
			try {
				await (HomeserverEE as IHomeserverServiceEE).inviteUser(userId, roomId);
				return API.v1.success({ success: true });
			} catch (error) {
				return API.v1.failure(error.message);
			}
		},
	},
);

API.v1.addRoute(
	'federation/homeserver/discover/:serverName',
	{
		authRequired: true,
		license: ['federation'],
	},
	{
		async get() {
			const { serverName } = this.urlParams;
			
			try {
				const serverInfo = await (HomeserverEE as IHomeserverServiceEE).discoverServer(serverName);
				return API.v1.success(serverInfo);
			} catch (error) {
				return API.v1.failure(error.message, 'not-found');
			}
		},
	},
);

API.v1.addRoute(
	'federation/homeserver/status',
	{
		authRequired: true,
		license: ['federation'],
	},
	{
		async get() {
			try {
				const status = await (HomeserverEE as IHomeserverServiceEE).configurationStatus();
				return API.v1.success(status);
			} catch (error) {
				return API.v1.failure(error.message);
			}
		},
	},
);

API.v1.addRoute(
	'federation/homeserver/health',
	{
		authRequired: false,
		license: ['federation'],
	},
	{
		async get() {
			return API.v1.success({
				status: 'healthy',
				timestamp: new Date().toISOString(),
			});
		},
	},
);