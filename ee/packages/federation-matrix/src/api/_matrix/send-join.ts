import type { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

import { getAllServicesFromFederationSDK } from '../../setupContainers';

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

const DepthSchema = {
	type: 'number',
	minimum: 0,
	description: 'Event depth',
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

const EventHashSchema = {
	type: 'object',
	properties: {
		sha256: {
			type: 'string',
			description: 'SHA256 hash of the event',
		},
	},
	required: ['sha256'],
};

const EventSignatureSchema = {
	type: 'object',
	description: 'Event signatures by server and key ID',
};

const MembershipEventContentSchema = {
	type: 'object',
	properties: {
		membership: {
			type: 'string',
			enum: ['join', 'leave', 'invite', 'ban', 'knock'],
			description: 'Membership state',
		},
		displayname: {
			type: 'string',
			nullable: true,
		},
		avatar_url: {
			type: 'string',
			nullable: true,
		},
		join_authorised_via_users_server: {
			type: 'string',
			nullable: true,
		},
		is_direct: {
			type: 'boolean',
			nullable: true,
		},
		reason: {
			type: 'string',
			description: 'Reason for membership change',
			nullable: true,
		},
	},
	required: ['membership'],
};

const EventBaseSchema = {
	type: 'object',
	properties: {
		type: {
			type: 'string',
			description: 'Event type',
		},
		content: {
			type: 'object',
			description: 'Event content',
		},
		sender: UsernameSchema,
		room_id: RoomIdSchema,
		origin_server_ts: TimestampSchema,
		depth: DepthSchema,
		prev_events: {
			type: 'array',
			items: {
				type: 'string',
			},
			description: 'Previous events in the room',
		},
		auth_events: {
			type: 'array',
			items: {
				type: 'string',
			},
			description: 'Authorization events',
		},
		origin: {
			type: 'string',
			description: 'Origin server',
		},
		hashes: {
			...EventHashSchema,
			nullable: true,
		},
		signatures: {
			...EventSignatureSchema,
			nullable: true,
		},
		unsigned: {
			type: 'object',
			description: 'Unsigned data',
			nullable: true,
		},
	},
	required: ['type', 'content', 'sender', 'room_id', 'origin_server_ts', 'depth', 'prev_events', 'auth_events', 'origin'],
};

const SendJoinEventSchema = {
	type: 'object',
	allOf: [
		EventBaseSchema,
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					const: 'm.room.member',
				},
				content: {
					type: 'object',
					allOf: [
						MembershipEventContentSchema,
						{
							type: 'object',
							properties: {
								membership: {
									type: 'string',
									const: 'join',
								},
							},
							required: ['membership'],
						},
					],
				},
				state_key: UsernameSchema,
			},
			required: ['type', 'content', 'state_key'],
		},
	],
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

export const getMatrixSendJoinRoutes = (router: Router<'/_matrix'>) => {
	const { sendJoin } = getAllServicesFromFederationSDK();

	return router.put(
		'/federation/v2/send_join/:roomId/:stateKey',
		{
			params: isSendJoinParamsProps,
			body: isSendJoinEventProps,
			response: {
				200: isSendJoinResponseProps,
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		async (c) => {
			const { roomId, stateKey } = c.req.param();
			const body = await c.req.json();

			const response = await sendJoin.sendJoin(roomId, stateKey, body);

			return {
				body: response,
				statusCode: 200,
			};
		},
	);
};
