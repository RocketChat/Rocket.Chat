import { federationSDK } from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

import { canAccessResourceMiddleware } from '../middlewares/canAccessResource';

const UsernameSchema = {
	type: 'string',
	pattern: '^@[A-Za-z0-9_=\\/.+-]+:(.+)$',
	description: 'Matrix user ID in format @user:server.com',
};

const RoomIdSchema = {
	type: 'string',
	pattern: '^![A-Za-z0-9_=\\/.+-]+:(.+)$',
	description: 'Matrix room ID in format !room:server.com',
};

const EventIdSchema = {
	type: 'string',
	pattern: '^\\$[A-Za-z0-9_=\\/.+-]+(:(.+))?$',
	description: 'Matrix event ID in format $event',
};

const TimestampSchema = {
	type: 'number',
	minimum: 0,
	description: 'Unix timestamp in milliseconds',
};

const ServerNameSchema = {
	type: 'string',
	description: 'Matrix server name',
};

const SendJoinParamsSchema = {
	type: 'object',
	properties: {
		roomId: RoomIdSchema,
		stateKey: EventIdSchema,
	},
	required: ['roomId', 'stateKey'],
};

const isSendJoinParamsProps = ajv.compile(SendJoinParamsSchema);

const SendJoinEventSchema = {
	type: 'object',
	properties: {
		type: {
			type: 'string',
			const: 'm.room.member',
		},
		state_key: {
			...UsernameSchema,
			description: 'Matrix user ID of the joining member',
		},
		sender: {
			...UsernameSchema,
			description: 'Matrix user ID of the joining member',
		},
		origin: {
			...ServerNameSchema,
			description: 'The name of the joining homeserver',
		},
		origin_server_ts: TimestampSchema,
		content: {
			type: 'object',
			properties: {
				membership: {
					type: 'string',
					const: 'join',
				},
				join_authorised_via_users_server: {
					...UsernameSchema,
					description: 'User ID of a resident server member authorizing the join into a restricted room',
				},
			},
			required: ['membership'],
		},
	},
	required: ['type', 'state_key', 'sender', 'origin', 'origin_server_ts', 'content'],
};

const isSendJoinEventProps = ajv.compile(SendJoinEventSchema);

const SendJoinResponseSchema = {
	type: 'object',
	properties: {
		event: {
			type: 'object',
			description: 'The processed join event',
		},
		state: {
			type: 'array',
			items: {
				type: 'object',
			},
			description: 'Current state events in the room',
		},
		auth_chain: {
			type: 'array',
			items: {
				type: 'object',
			},
			description: 'Authorization chain for the event',
		},
		members_omitted: {
			type: 'boolean',
			description: 'Whether member events were omitted',
		},
		origin: ServerNameSchema,
	},
	required: ['event', 'state', 'auth_chain', 'members_omitted', 'origin'],
};

const isSendJoinResponseProps = ajv.compile(SendJoinResponseSchema);

export const getMatrixSendJoinRoutes = () => {
	return new Router('/federation').put(
		'/v2/send_join/:roomId/:stateKey',
		{
			params: isSendJoinParamsProps,
			body: isSendJoinEventProps,
			response: {
				200: isSendJoinResponseProps,
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		canAccessResourceMiddleware('room'),
		async (c) => {
			const { roomId, stateKey } = c.req.param();
			const body = await c.req.json();

			const response = await federationSDK.sendJoin(roomId, stateKey, body);

			return {
				body: response,
				statusCode: 200,
			};
		},
	);
};
