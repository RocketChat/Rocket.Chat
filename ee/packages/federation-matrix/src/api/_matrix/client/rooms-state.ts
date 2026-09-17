import type { PersistentEventBase, RoomID, UserID } from '@rocket.chat/federation-sdk';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { ajv } from '@rocket.chat/rest-typings';

import type { ClientRouter } from './_shared';
import {
	MATRIX_ROOM_ID_PATTERN,
	internalError,
	isUnknownRoomError,
	notImplemented,
	roomNotFound,
	isImpersonationQueryProps,
	isMatrixErrorProps,
	isRoomIdParamsProps,
	license,
	tags,
} from './_shared';
import { isAppServiceAuthenticatedMiddleware } from '../../middlewares/isAppServiceAuthenticated';

const JoinedMembersResponseSchema = {
	type: 'object',
	properties: {
		joined: {
			type: 'object',
			additionalProperties: {
				type: 'object',
				properties: {
					display_name: { type: 'string', nullable: true },
					avatar_url: { type: 'string', nullable: true },
				},
				additionalProperties: true,
			},
		},
	},
	required: ['joined'],
};

const isJoinedMembersResponseProps = ajv.compile(JoinedMembersResponseSchema);

const StateArrayResponseSchema = {
	type: 'array',
	items: { type: 'object', additionalProperties: true },
};

const isStateArrayResponseProps = ajv.compile(StateArrayResponseSchema);

const StateEventParamsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string', pattern: MATRIX_ROOM_ID_PATTERN },
		eventType: { type: 'string' },
		stateKey: { type: 'string' },
	},
	required: ['roomId', 'eventType'],
};

const isStateEventParamsProps = ajv.compile(StateEventParamsSchema);

const StateContentResponseSchema = {
	type: 'object',
	additionalProperties: true,
};

const isStateContentResponseProps = ajv.compile(StateContentResponseSchema);

const PutStateBodySchema = {
	type: 'object',
	additionalProperties: true,
};

const isPutStateBodyProps = ajv.compile(PutStateBodySchema);

const PutStateResponseSchema = {
	type: 'object',
	properties: {
		event_id: { type: 'string' },
	},
	required: ['event_id'],
};

const isPutStateResponseProps = ajv.compile(PutStateResponseSchema);

const getRoomStateEvent = async (roomId: RoomID, eventType: string, stateKey = '') => {
	try {
		const state = await federationSDK.getLatestRoomState(roomId);

		const key = `${eventType}:${stateKey}`;

		let pe: PersistentEventBase | undefined;
		for (const [k, v] of state) {
			if (k === key) {
				pe = v;
				break;
			}
		}
		if (!pe) {
			return {
				statusCode: 404 as const,
				body: {
					errcode: 'M_NOT_FOUND',
					error: 'State event not found',
				},
			};
		}
		return {
			statusCode: 200 as const,
			body: pe.getContent(),
		};
	} catch (error) {
		if (isUnknownRoomError(error)) {
			return roomNotFound();
		}
		return internalError('Failed to fetch state event', error);
	}
};

const putRoomStateEvent = async (
	roomId: RoomID,
	eventType: string,
	senderUsername: UserID,
	body: Record<string, unknown>,
	stateKey = '',
) => {
	try {
		// The supported event types are all empty-state-key events per spec; writing them in
		// response to a keyed request would silently target the wrong state.
		if (stateKey) {
			return notImplemented('State events with a non-empty state key are not yet implemented', { roomId, eventType, stateKey });
		}
		if (eventType === 'm.room.name' && typeof body.name === 'string') {
			const event = await federationSDK.updateRoomName(roomId, body.name, senderUsername);
			return {
				statusCode: 200 as const,
				body: { event_id: event.eventId },
			};
		}
		if (eventType === 'm.room.topic' && typeof body.topic === 'string') {
			const event = await federationSDK.setRoomTopic(roomId, senderUsername, body.topic);

			return {
				statusCode: 200 as const,
				body: { event_id: event.eventId },
			};
		}

		// TODO: extend SDK to send arbitrary state events
		return notImplemented(`State event type ${eventType} not yet implemented`, { roomId, eventType, senderUsername });
	} catch (error) {
		return internalError('Failed to send state event', error, { roomId, eventType, senderUsername });
	}
};

export const addRoomsStateRoutes = (router: ClientRouter) => {
	router
		// GET /_matrix/client/v3/rooms/:roomId/joined_members
		.get(
			'/v3/rooms/:roomId/joined_members',
			{
				params: isRoomIdParamsProps,
				response: {
					200: isJoinedMembersResponseProps,
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

				try {
					const state = await federationSDK.getLatestRoomState(roomId);
					const joined: Record<string, { display_name?: string; avatar_url?: string }> = {};
					for (const [key, pe] of state) {
						if (!key.startsWith('m.room.member:')) continue;
						const content = pe.getContent() as { membership?: string; displayname?: string; avatar_url?: string };
						if (content?.membership !== 'join') continue;
						const userId = pe.stateKey;
						if (!userId) continue;
						joined[userId] = {
							...(content.displayname ? { display_name: content.displayname } : {}),
							...(content.avatar_url ? { avatar_url: content.avatar_url } : {}),
						};
					}
					return {
						statusCode: 200,
						body: { joined },
					};
				} catch (error) {
					if (isUnknownRoomError(error)) {
						return roomNotFound();
					}
					return internalError('Failed to fetch joined members', error, { roomId });
				}
			},
		)

		// GET /_matrix/client/v3/rooms/:roomId/state
		.get(
			'/v3/rooms/:roomId/state',
			{
				params: isRoomIdParamsProps,
				response: {
					200: isStateArrayResponseProps,
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
				try {
					const state = await federationSDK.getLatestRoomState(roomId);
					const events: unknown[] = [];
					for (const pe of state.values()) {
						events.push(pe.event);
					}
					return {
						statusCode: 200,
						body: events,
					};
				} catch (error) {
					if (isUnknownRoomError(error)) {
						return roomNotFound();
					}
					return internalError('Failed to fetch room state', error, { roomId });
				}
			},
		)

		// GET /_matrix/client/v3/rooms/:roomId/state/:eventType/
		// The optional-param route below (`:stateKey?`) matches `/state/:eventType` and
		// `/state/:eventType/:stateKey`, but NOT the trailing-slash form `/state/:eventType/`
		// (an empty final segment). Bridges request that trailing-slash URL for the
		// default (empty) state key, so this explicit route handles it with stateKey=''.
		.get(
			'/v3/rooms/:roomId/state/:eventType/',
			{
				params: isStateEventParamsProps,
				response: {
					200: isStateContentResponseProps,
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
				const eventType = c.req.param('eventType') as string;

				return getRoomStateEvent(roomId, eventType);
			},
		)

		// GET /_matrix/client/v3/rooms/:roomId/state/:eventType/:stateKey?
		.get(
			'/v3/rooms/:roomId/state/:eventType/:stateKey?',
			{
				params: isStateEventParamsProps,
				response: {
					200: isStateContentResponseProps,
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
				const eventType = c.req.param('eventType') as string;
				const stateKey = c.req.param('stateKey') ?? '';

				return getRoomStateEvent(roomId, eventType, stateKey);
			},
		)

		// PUT /_matrix/client/v3/rooms/:roomId/state/:eventType/
		// Same trailing-slash note as the GET above: the optional-param route (`:stateKey?`)
		// doesn't match an empty final segment, so this explicit route handles it with stateKey=''.
		.put(
			'/v3/rooms/:roomId/state/:eventType/',
			{
				params: isStateEventParamsProps,
				query: isImpersonationQueryProps,
				body: isPutStateBodyProps,
				response: {
					200: isPutStateResponseProps,
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
				const eventType = c.req.param('eventType') as string;
				const senderUsername = c.get('impersonatedUserId') as UserID;
				const body = await c.req.json();

				return putRoomStateEvent(roomId, eventType, senderUsername, body);
			},
		)

		// PUT /_matrix/client/v3/rooms/:roomId/state/:eventType/:stateKey?
		// The state key is optional per spec: `PUT /state/:eventType` targets the empty state key.
		.put(
			'/v3/rooms/:roomId/state/:eventType/:stateKey?',
			{
				params: isStateEventParamsProps,
				query: isImpersonationQueryProps,
				body: isPutStateBodyProps,
				response: {
					200: isPutStateResponseProps,
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
				const eventType = c.req.param('eventType') as string;
				const stateKey = c.req.param('stateKey') ?? '';
				const senderUsername = c.get('impersonatedUserId') as UserID;
				const body = await c.req.json();

				return putRoomStateEvent(roomId, eventType, senderUsername, body, stateKey);
			},
		);
};
