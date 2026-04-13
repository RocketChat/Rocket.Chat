import { NotAllowedError, federationSDK } from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { ajv } from '@rocket.chat/rest-typings';

import { isAuthenticatedMiddleware } from '../middlewares/isAuthenticated';

const isMakeLeaveParamsProps = ajv.compile({
	type: 'object',
	properties: { roomId: { type: 'string' }, userId: { type: 'string' } },
	required: ['roomId', 'userId'],
});
const isMakeLeaveSuccessResponseProps = ajv.compile({
	type: 'object',
	properties: {
		event: {
			type: 'object',
			properties: {
				content: {
					type: 'object',
					properties: {
						membership: {
							type: 'string',
							const: 'leave',
						},
					},
				},
				origin: {
					type: 'string',
				},
				origin_server_ts: {
					type: 'number',
				},
				sender: {
					type: 'string',
				},
				state_key: {
					type: 'string',
				},
				type: {
					type: 'string',
					const: 'm.room.member',
				},
			},
		},
		room_version: { type: 'string' },
	},
});
const isMakeLeaveForbiddenResponseProps = ajv.compile({
	type: 'object',
	properties: { errcode: { type: 'string', const: 'M_FORBIDDEN' }, error: { type: 'string' } },
});
const isMakeLeaveErrorResponseProps = ajv.compile({
	type: 'object',
	properties: { errcode: { type: 'string', const: 'M_UNKNOWN' }, error: { type: 'string' } },
});

export const getMatrixMakeLeaveRoutes = () => {
	const logger = new Logger('matrix-make-leave');

	return new Router('/federation').get(
		'/v1/make_leave/:roomId/:userId',
		{
			params: isMakeLeaveParamsProps,
			response: {
				200: isMakeLeaveSuccessResponseProps,
				403: isMakeLeaveForbiddenResponseProps,
				500: isMakeLeaveErrorResponseProps,
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		isAuthenticatedMiddleware(),
		async (c) => {
			const { roomId, userId } = c.req.param();
			try {
				// TODO: Remove out of spec attributes being returned
				const makeLeaveResponse = await federationSDK.makeLeave(roomId, userId);
				return {
					body: makeLeaveResponse,
					statusCode: 200,
				};
			} catch (error) {
				if (error instanceof NotAllowedError) {
					return {
						body: {
							errcode: 'M_FORBIDDEN',
							error: 'This server does not allow leaving this room based on federation settings.',
						},
						statusCode: 403,
					};
				}

				logger.error({ msg: 'Error making leave', err: error });

				return {
					body: {
						errcode: 'M_UNKNOWN',
						error: error instanceof Error ? error.message : 'Internal server error while processing request',
					},
					statusCode: 500,
				};
			}
		},
	);
};
