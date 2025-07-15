import type { HomeserverServices } from '@hs/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

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
		sender: {
			type: 'string',
		},
		room_id: {
			type: 'string',
		},
		origin_server_ts: {
			type: 'number',
		},
		depth: {
			type: 'number',
		},
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
			type: 'object',
			nullable: true,
		},
		signatures: {
			type: 'object',
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

const MembershipEventContentSchema = {
	type: 'object',
	properties: {
		membership: {
			type: 'string',
		},
		displayname: {
			type: 'string',
			nullable: true,
		},
		avatar_url: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['membership'],
};

const RoomMemberEventSchema = {
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
				content: MembershipEventContentSchema,
				state_key: {
					type: 'string',
				},
			},
			required: ['type', 'content', 'state_key'],
		},
	],
};

const isProcessInviteBodyProps = ajv.compile(RoomMemberEventSchema);

const ProcessInviteParamsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		eventId: {
			type: 'string',
		},
	},
	required: ['roomId', 'eventId'],
};

const isProcessInviteParamsProps = ajv.compile(ProcessInviteParamsSchema);

const ProcessInviteResponseSchema = {
	type: 'object',
	properties: {
		event: RoomMemberEventSchema,
	},
	required: ['event'],
};

const isProcessInviteResponseProps = ajv.compile(ProcessInviteResponseSchema);

export const getMatrixInviteRoutes = (services: HomeserverServices) => {
	const { invite } = services;

	return new Router('/federation').put(
		'/v2/invite/:roomId/:eventId',
		{
			body: isProcessInviteBodyProps,
			params: isProcessInviteParamsProps,
			response: {
				200: isProcessInviteResponseProps,
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		async (c) => {
			const { roomId, eventId } = c.req.param();
			const body = await c.req.json();

			const response = await invite.processInvite(body, roomId, eventId);

			return {
				body: response,
				statusCode: 200,
			};
		},
	);
};
