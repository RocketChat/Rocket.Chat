import type { RoomID, UserID } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { ajv } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import {
	MATRIX_ROOM_ID_PATTERN,
	MATRIX_USER_ID_PATTERN,
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
				500: isMatrixErrorProps,
			},
			tags,
			license,
		},
		isAppServiceAuthenticatedMiddleware(),
		async (c) => {
			const roomId = c.req.param('roomId') as RoomID;
			const userId = c.req.param('userId') as UserID;
			const senderId = c.get('impersonatedUserId') as string;
			const body = await c.req.json();

			if (userId !== senderId) {
				return {
					statusCode: 403,
					body: {
						errcode: 'M_FORBIDDEN',
						error: "Cannot edit another user's per-room profile",
					},
				};
			}

			try {
				await federationSDK.updateUserProfile(roomId, userId, {
					displayname: body.displayname ?? undefined,
				});
				return {
					statusCode: 200,
					body: {},
				};
			} catch (error) {
				return {
					statusCode: 500,
					body: {
						errcode: 'M_UNKNOWN',
						error: 'Failed to update per-room displayname',
					},
				};
			}
		},
	);
};
