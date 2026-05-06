import type { RoomID, UserID } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import {
	MATRIX_ROOM_ID_PATTERN,
	MATRIX_USER_ID_PATTERN,
	isEmptyObjectResponseProps,
	isImpersonationQueryProps,
	isMatrixErrorProps,
	isRoomIdParamsProps,
	license,
	tags,
} from './_shared';
import { isAppServiceAuthenticatedMiddleware } from '../../middlewares/isAppServiceAuthenticated';

const SendEventParamsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string', pattern: MATRIX_ROOM_ID_PATTERN },
		eventType: { type: 'string' },
		txnId: { type: 'string' },
	},
	required: ['roomId', 'eventType', 'txnId'],
};

const isSendEventParamsProps = ajv.compile(SendEventParamsSchema);

const SendEventBodySchema = {
	type: 'object',
	additionalProperties: true,
};

const isSendEventBodyProps = ajv.compile(SendEventBodySchema);

const SendEventResponseSchema = {
	type: 'object',
	properties: {
		event_id: { type: 'string' },
	},
	required: ['event_id'],
};

const isSendEventResponseProps = ajv.compile(SendEventResponseSchema);

const MessagesQuerySchema = {
	type: 'object',
	properties: {
		user_id: { type: 'string' },
		from: { type: 'string' },
		to: { type: 'string' },
		dir: { type: 'string', enum: ['b', 'f'] },
		limit: { oneOf: [{ type: 'number' }, { type: 'string' }] },
		filter: { type: 'string' },
	},
};

const isMessagesQueryProps = ajvQuery.compile<{
	user_id?: string;
	from?: string;
	to?: string;
	dir?: 'b' | 'f';
	limit?: number | string;
	filter?: string;
}>(MessagesQuerySchema);

const MessagesResponseSchema = {
	type: 'object',
	properties: {
		chunk: { type: 'array', items: { type: 'object', additionalProperties: true } },
		start: { type: 'string' },
		end: { type: 'string' },
	},
	additionalProperties: true,
};

const isMessagesResponseProps = ajv.compile(MessagesResponseSchema);

const TypingParamsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string', pattern: MATRIX_ROOM_ID_PATTERN },
		userId: { type: 'string', pattern: MATRIX_USER_ID_PATTERN },
	},
	required: ['roomId', 'userId'],
};

const isTypingParamsProps = ajv.compile(TypingParamsSchema);

const TypingBodySchema = {
	type: 'object',
	properties: {
		typing: { type: 'boolean' },
		timeout: { type: 'number' },
	},
	required: ['typing'],
	additionalProperties: true,
};

const isTypingBodyProps = ajv.compile(TypingBodySchema);

const ReceiptParamsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string', pattern: MATRIX_ROOM_ID_PATTERN },
		eventId: { type: 'string' },
	},
	required: ['roomId', 'eventId'],
};

const isReceiptParamsProps = ajv.compile(ReceiptParamsSchema);

const ReceiptBodySchema = {
	type: 'object',
	additionalProperties: true,
};

const isReceiptBodyProps = ajv.compile(ReceiptBodySchema);

export const addRoomsMessagingRoutes = (router: ClientRouter) => {
	router
		// PUT /_matrix/client/v3/rooms/:roomId/send/:eventType/:txnId
		.put(
			'/v3/rooms/:roomId/send/:eventType/:txnId',
			{
				params: isSendEventParamsProps,
				query: isImpersonationQueryProps,
				body: isSendEventBodyProps,
				response: {
					200: isSendEventResponseProps,
					400: isMatrixErrorProps,
					401: isMatrixErrorProps,
					403: isMatrixErrorProps,
					500: isMatrixErrorProps,
					501: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const roomId = c.req.param('roomId') as RoomID;
				const eventType = c.req.param('eventType');
				const senderId = c.get('impersonatedUserId') as UserID;
				const body = await c.req.json();

				console.log('/v3/rooms/:roomId/send/:eventType/:txnId', { roomId, eventType, senderId, body });

				if (eventType !== 'm.room.message') {
					// TODO: support additional event types (m.reaction, m.room.redaction, etc.)
					return {
						statusCode: 501,
						body: {
							errcode: 'M_UNRECOGNIZED',
							error: 'Only m.room.message is supported in v1',
						},
					};
				}

				if (typeof body.body !== 'string' || typeof body.msgtype !== 'string') {
					return {
						statusCode: 400,
						body: {
							errcode: 'M_BAD_JSON',
							error: 'm.room.message requires string fields body and msgtype',
						},
					};
				}

				// TODO: deduplicate by txnId to handle bridge retries
				try {
					const event = await federationSDK.sendMessage(roomId, body.body, body.formatted_body ?? body.body, senderId);
					return {
						statusCode: 200,
						body: {
							event_id: event.eventId,
						},
					};
				} catch (error) {
					return {
						statusCode: 500,
						body: {
							errcode: 'M_UNKNOWN',
							error: 'Failed to send message',
						},
					};
				}
			},
		)

		// GET /_matrix/client/v3/rooms/:roomId/messages
		.get(
			'/v3/rooms/:roomId/messages',
			{
				params: isRoomIdParamsProps,
				query: isMessagesQueryProps,
				response: {
					200: isMessagesResponseProps,
					401: isMatrixErrorProps,
					500: isMatrixErrorProps,
				},
				tags,
				license,
			},
			isAppServiceAuthenticatedMiddleware(),
			async (c) => {
				const roomId = c.req.param('roomId') as RoomID;
				const fromParam = c.req.query('from');
				const limitParam = c.req.query('limit');
				const limit = limitParam ? Number(limitParam) || 10 : 10;

				try {
					if (!fromParam) {
						return {
							statusCode: 200,
							body: {
								chunk: [],
								start: '',
								end: '',
							},
						};
					}
					const result = await federationSDK.getBackfillEvents(roomId, [fromParam] as never, limit);
					return {
						statusCode: 200,
						body: {
							chunk: result.pdus,
							start: fromParam,
							end: '',
						},
					};
				} catch (error) {
					return {
						statusCode: 500,
						body: {
							errcode: 'M_UNKNOWN',
							error: 'Failed to fetch messages',
						},
					};
				}
			},
		)

		// PUT /_matrix/client/v3/rooms/:roomId/typing/:userId
		.put(
			'/v3/rooms/:roomId/typing/:userId',
			{
				params: isTypingParamsProps,
				query: isImpersonationQueryProps,
				body: isTypingBodyProps,
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
				const userId = c.req.param('userId');
				const body = await c.req.json();

				try {
					await federationSDK.sendTypingNotification(roomId, userId, body.typing === true);
					return {
						statusCode: 200,
						body: {},
					};
				} catch (error) {
					return {
						statusCode: 500,
						body: {
							errcode: 'M_UNKNOWN',
							error: 'Failed to send typing notification',
						},
					};
				}
			},
		)

		// POST /_matrix/client/v3/rooms/:roomId/receipt/m.read/:eventId
		.post(
			'/v3/rooms/:roomId/receipt/m.read/:eventId',
			{
				params: isReceiptParamsProps,
				query: isImpersonationQueryProps,
				body: isReceiptBodyProps,
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
				const eventId = c.req.param('eventId');
				const senderId = c.get('impersonatedUserId') as string;

				try {
					await federationSDK.sendReadReceipt({
						roomId,
						userId: senderId,
						eventIds: [eventId] as never,
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
							error: 'Failed to send read receipt',
						},
					};
				}
			},
		);
};
