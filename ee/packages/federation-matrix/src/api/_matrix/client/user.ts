import type { RoomID } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Users } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import {
	MATRIX_ROOM_ID_PATTERN,
	MATRIX_USER_ID_PATTERN,
	internalError,
	isEmptyObjectResponseProps,
	isImpersonationQueryProps,
	isMatrixErrorProps,
	license,
	tags,
} from './_shared';
import { isAppServiceAuthenticatedMiddleware } from '../../middlewares/isAppServiceAuthenticated';

const AccountDataDisplaynameParamsSchema = {
	type: 'object',
	properties: {
		userId: { type: 'string', pattern: MATRIX_USER_ID_PATTERN },
		roomId: { type: 'string', pattern: MATRIX_ROOM_ID_PATTERN },
	},
	required: ['userId', 'roomId'],
};

const isAccountDataDisplaynameParamsProps = ajv.compile(AccountDataDisplaynameParamsSchema);

const AccountDataDisplaynameBodySchema = {
	type: 'object',
	properties: {
		displayname: { type: 'string', nullable: true },
	},
	additionalProperties: true,
};

const isAccountDataDisplaynameBodyProps = ajv.compile(AccountDataDisplaynameBodySchema);

export const addUserRoutes = (router: ClientRouter) => {
	router.put(
		'/v3/user/:userId/rooms/:roomId/account_data/m.room.displayname',
		{
			params: isAccountDataDisplaynameParamsProps,
			query: isImpersonationQueryProps,
			body: isAccountDataDisplaynameBodyProps,
			response: {
				200: isEmptyObjectResponseProps,
				401: isMatrixErrorProps,
				403: isMatrixErrorProps,
				404: isMatrixErrorProps,
				500: isMatrixErrorProps,
			},
			tags,
			license,
		},
		isAppServiceAuthenticatedMiddleware(),
		async (c) => {
			const roomId = c.req.param('roomId') as RoomID;
			const senderUsername = c.get('impersonatedUserId') as string;
			const body = await c.req.json();

			const user = await Users.findOneByUsername(senderUsername);
			if (!user) {
				return {
					statusCode: 404,
					body: {
						errcode: 'M_NOT_FOUND',
						error: 'User not found',
					},
				};
			}

			try {
				await federationSDK.updateUserProfile(roomId, senderUsername, {
					displayname: body.displayname ?? undefined,
				});
				return {
					statusCode: 200,
					body: {},
				};
			} catch (error) {
				return internalError('Failed to update per-room displayname', error, { roomId, senderUsername });
			}
		},
	);
};
