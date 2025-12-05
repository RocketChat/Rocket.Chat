import { NotAllowedError, federationSDK } from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { ajv } from '@rocket.chat/rest-typings';

import { isAuthenticatedMiddleware } from '../middlewares/isAuthenticated';

const isSendLeaveParamsProps = ajv.compile({
	type: 'object',
	properties: { roomId: { type: 'string' }, eventId: { type: 'string' } },
	required: ['roomId', 'eventId'],
});
const isSendLeaveBodyProps = ajv.compile({
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
		depth: {
			type: 'number',
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
	required: ['content', 'depth', 'origin', 'origin_server_ts', 'sender', 'state_key', 'type'],
});
const isSendLeaveSuccessResponseProps = ajv.compile({
	type: 'object',
	properties: {},
});
const isSendLeaveForbiddenResponseProps = ajv.compile({
	type: 'object',
	properties: { errcode: { type: 'string', const: 'M_FORBIDDEN' }, error: { type: 'string' } },
});
const isSendLeaveErrorResponseProps = ajv.compile({
	type: 'object',
	properties: { errcode: { type: 'string', const: 'M_UNKNOWN' }, error: { type: 'string' } },
});

export const getMatrixSendLeaveRoutes = () => {
	const logger = new Logger('matrix-send-leave');

	return new Router('/federation').put(
		'/v2/send_leave/:roomId/:eventId',
		{
			params: isSendLeaveParamsProps,
			body: isSendLeaveBodyProps,
			response: {
				200: isSendLeaveSuccessResponseProps,
				403: isSendLeaveForbiddenResponseProps,
				500: isSendLeaveErrorResponseProps,
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		isAuthenticatedMiddleware(),
		async (c) => {
			const { roomId, eventId } = c.req.param();
			const body = await c.req.json();
			try {
				await federationSDK.sendLeave(roomId, eventId, body);
				return {
					body: {},
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
