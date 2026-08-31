import { ajv } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import {
	MATRIX_ROOM_ID_PATTERN,
	notImplemented,
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

const DirectoryPutBodySchema = {
	type: 'object',
	properties: {
		room_id: { type: 'string', pattern: MATRIX_ROOM_ID_PATTERN },
	},
	required: ['room_id'],
	additionalProperties: true,
};

const isDirectoryPutBodyProps = ajv.compile(DirectoryPutBodySchema);

export const addDirectoryRoutes = (router: ClientRouter) => {
	router
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
				return notImplemented('Room alias creation not yet implemented');
			},
		);
};
