import { federationSDK } from '@rocket.chat/federation-sdk';
import { ajv } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import {
	MATRIX_ROOM_ID_PATTERN,
	isEmptyObjectResponseProps,
	isImpersonationQueryProps,
	isMatrixErrorProps,
	license,
	tags,
} from './_shared';
import { isAppServiceAuthenticatedMiddleware } from '../../middlewares/isAppServiceAuthenticated';

const RoomAliasParamsSchema = {
	type: 'object',
	properties: {
		roomAlias: { type: 'string' },
	},
	required: ['roomAlias'],
};

const isRoomAliasParamsProps = ajv.compile(RoomAliasParamsSchema);

const DirectoryResponseSchema = {
	type: 'object',
	properties: {
		room_id: { type: 'string' },
		servers: { type: 'array', items: { type: 'string' } },
	},
	required: ['room_id'],
};

const isDirectoryResponseProps = ajv.compile(DirectoryResponseSchema);

const DirectoryPutBodySchema = {
	type: 'object',
	properties: {
		room_id: { type: 'string', pattern: MATRIX_ROOM_ID_PATTERN },
	},
	required: ['room_id'],
	additionalProperties: true,
};

const isDirectoryPutBodyProps = ajv.compile(DirectoryPutBodySchema);

const PublicRoomsResponseSchema = {
	type: 'object',
	properties: {
		chunk: {
			type: 'array',
			items: { type: 'object', additionalProperties: true },
		},
		total_room_count_estimate: { type: 'number' },
	},
	required: ['chunk'],
};

const isPublicRoomsResponseProps = ajv.compile(PublicRoomsResponseSchema);

export const addDirectoryRoutes = (router: ClientRouter) => {
	router
		// GET /_matrix/client/v3/directory/room/:roomAlias
		.get(
			'/v3/directory/room/:roomAlias',
			{
				params: isRoomAliasParamsProps,
				response: {
					200: isDirectoryResponseProps,
					401: isMatrixErrorProps,
					404: isMatrixErrorProps,
					501: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async () => {
				// TODO(federation-sdk): resolveAlias(roomAlias) → {roomId, servers}
				return {
					statusCode: 501,
					body: {
						errcode: 'M_UNRECOGNIZED',
						error: 'Room alias resolution not yet implemented',
					},
				};
			},
		)

		// PUT /_matrix/client/v3/directory/room/:roomAlias
		.put(
			'/v3/directory/room/:roomAlias',
			{
				params: isRoomAliasParamsProps,
				query: isImpersonationQueryProps,
				body: isDirectoryPutBodyProps,
				response: {
					200: isEmptyObjectResponseProps,
					401: isMatrixErrorProps,
					403: isMatrixErrorProps,
					501: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async () => {
				// TODO(federation-sdk): createAlias(alias, roomId, sender)
				return {
					statusCode: 501,
					body: {
						errcode: 'M_UNRECOGNIZED',
						error: 'Room alias creation not yet implemented',
					},
				};
			},
		)

		// GET /_matrix/client/v3/publicRooms
		.get(
			'/v3/publicRooms',
			{
				response: {
					200: isPublicRoomsResponseProps,
					401: isMatrixErrorProps,
					500: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async () => {
				try {
					const rooms = await federationSDK.getAllPublicRoomIdsAndNames();
					return {
						statusCode: 200,
						body: {
							chunk: rooms.map((r) => ({
								room_id: r.room_id,
								name: r.name,
								num_joined_members: 0,
								world_readable: false,
								guest_can_join: false,
							})),
							total_room_count_estimate: rooms.length,
						},
					};
				} catch (error) {
					return {
						statusCode: 500,
						body: {
							errcode: 'M_UNKNOWN',
							error: 'Failed to list public rooms',
						},
					};
				}
			},
		);
};
