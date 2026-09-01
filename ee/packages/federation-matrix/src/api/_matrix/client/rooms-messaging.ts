import { api, FederationMatrix, Room } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { isUserNativeFederated } from '@rocket.chat/core-typings';
import type { EventID, FileMessageContent, FileMessageType, PduForType, RoomID, UserID } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Rooms, Users } from '@rocket.chat/models';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import {
	MATRIX_ROOM_ID_PATTERN,
	MATRIX_USER_ID_PATTERN,
	internalError,
	notImplemented,
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
		// a union type list rather than `oneOf`: ajvQuery coerces between number and string, so both
		// `oneOf` branches would match a numeric value and fail validation
		limit: { type: ['number', 'string'] },
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
				const senderUsername = c.get('impersonatedUserId') as UserID;
				const body = await c.req.json();

				if (eventType === 'org.matrix.bridge.ping') {
					try {
						const event = await federationSDK.sendCustomEvent(roomId, eventType, body, senderUsername);

						return {
							statusCode: 200,
							body: {
								event_id: event.eventId,
							},
						};
					} catch (error) {
						return internalError('Failed to send ping event', error, { roomId, senderUsername });
					}
				}

				if (eventType !== 'm.room.message') {
					// TODO: support additional event types (m.reaction, m.room.redaction, etc.)
					return notImplemented('Only m.room.message is supported in v1', { eventType });
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

				const fileMsgtypes: FileMessageType[] = ['m.image', 'm.file', 'm.audio', 'm.video'];
				const isFileMessage = fileMsgtypes.includes(body.msgtype);

				if (isFileMessage && typeof body.url !== 'string') {
					return {
						statusCode: 400,
						body: {
							errcode: 'M_BAD_JSON',
							error: `${body.msgtype} requires a string url field`,
						},
					};
				}

				// TODO: deduplicate by txnId to handle bridge retries
				try {
					if (isFileMessage) {
						const fileContent: FileMessageContent = {
							body: body.body,
							msgtype: body.msgtype,
							url: body.url,
							info: body.info,
						};
						const event = await federationSDK.sendFileMessage(roomId, fileContent, senderUsername);

						await FederationMatrix.saveFederationMessage({
							event: event.event as PduForType<'m.room.message'>,
							event_id: event.eventId,
						});

						return {
							statusCode: 200,
							body: {
								event_id: event.eventId,
							},
						};
					}

					const event = await federationSDK.sendMessage(roomId, body.body, body.formatted_body ?? body.body, senderUsername);

					await FederationMatrix.saveFederationMessage({ event: event.event as PduForType<'m.room.message'>, event_id: event.eventId });

					return {
						statusCode: 200,
						body: {
							event_id: event.eventId,
						},
					};
				} catch (error) {
					return internalError('Failed to send message', error, { roomId });
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
					if (!fromParam || limit <= 0) {
						return {
							statusCode: 200,
							body: {
								chunk: [],
								start: '',
								end: '',
							},
						};
					}
					const result = await federationSDK.getBackfillEvents(roomId, [fromParam] as EventID[], limit);
					return {
						statusCode: 200,
						body: {
							chunk: result.pdus,
							start: fromParam,
							end: '',
						},
					};
				} catch (error) {
					return internalError('Failed to fetch messages', error, { roomId });
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
					400: isMatrixErrorProps,
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
				const username = c.get('impersonatedUserId');
				const body = await c.req.json();

				if (!username) {
					return {
						statusCode: 400,
						body: {
							errcode: 'M_BAD_REQUEST',
							error: 'Missing userId parameter',
						},
					};
				}

				try {
					const matrixRoom = await Rooms.findOne({ 'federation.mrid': roomId }, { projection: { _id: 1 } });
					if (!matrixRoom) {
						return {
							statusCode: 404,
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Room not found',
							},
						};
					}

					const user = await Users.findOneByUsername<Pick<IUser, 'name' | 'username' | 'federated' | 'federation'>>(username, {
						projection: { name: 1, username: 1, federated: 1, federation: 1 },
					});
					if (!user || !isUserNativeFederated(user)) {
						return {
							statusCode: 404,
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'User not found',
							},
						};
					}

					void api.broadcast('user.activity', {
						user: user.name || user.username,
						isTyping: body.typing,
						roomId: matrixRoom._id,
					});

					await federationSDK.sendTypingNotification(roomId, username, body.typing === true);
					return {
						statusCode: 200,
						body: {},
					};
				} catch (error) {
					return internalError('Failed to send typing notification', error, { roomId, userId: username });
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

				try {
					const matrixUser = await Users.findOneByUsername(senderUsername);
					if (!matrixUser) {
						return {
							statusCode: 404,
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'User not found',
							},
						};
					}

					const matrixRoom = await Rooms.findOne({ 'federation.mrid': roomId });
					if (!matrixRoom) {
						return {
							statusCode: 404,
							body: {
								errcode: 'M_NOT_FOUND',
								error: 'Room not found',
							},
						};
					}

					await Room.markAsRead(matrixRoom, matrixUser._id);

					return {
						statusCode: 200,
						body: {},
					};
				} catch (error) {
					return internalError('Failed to send read receipt', error, { roomId, senderUsername });
				}
			},
		);
};
