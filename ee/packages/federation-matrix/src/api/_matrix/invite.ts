import { Authorization } from '@rocket.chat/core-services';
import { NotAllowedError, federationSDK } from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

import { isAuthenticatedMiddleware } from '../middlewares/isAuthenticated';

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
	required: ['type', 'content', 'sender', 'room_id', 'origin_server_ts', 'depth', 'prev_events', 'auth_events'],
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

export const getMatrixInviteRoutes = () => {
	const logger = new Logger('matrix-invite');

	return new Router('/federation').put(
		'/v2/invite/:roomId/:eventId',
		{
			body: ajv.compile({ type: 'object' }), // TODO: add schema from room package.
			params: isProcessInviteParamsProps,
			response: {
				200: isProcessInviteResponseProps,
			},
			tags: ['Federation'],
			license: ['federation'],
		},
		isAuthenticatedMiddleware(),
		async (c) => {
			const { roomId, eventId } = c.req.param();
			const { event, room_version: roomVersion, invite_room_state: strippedStateEvents } = await c.req.json();

			const userToCheck = event.state_key as string;

			if (!userToCheck) {
				throw new Error('join event has missing state key, unable to determine user to join');
			}

			if (!strippedStateEvents?.some((e: any) => e.type === 'm.room.create')) {
				return {
					body: {
						errcode: 'M_MISSING_PARAM',
						error: 'Missing invite_room_state: m.room.create event is required',
					},
					statusCode: 400,
				};
			}

			const [username /* domain */] = userToCheck.split(':');

			// TODO: check domain

			const ourUser = await Users.findOneByUsername(username.slice(1));

			if (!ourUser) {
				throw new Error('user not found not processing invite');
			}

			// check federation permission before processing the invite
			if (!(await Authorization.hasPermission(ourUser._id, 'access-federation'))) {
				logger.info(`User ${userToCheck} denied federation access, rejecting invite to room ${roomId}`);

				return {
					body: {
						errcode: 'M_FORBIDDEN',
						error: 'User does not have permission to access federation',
					},
					statusCode: 403,
				};
			}

			try {
				const inviteEvent = await federationSDK.processInvite(event, eventId, roomVersion, strippedStateEvents);

				return {
					body: {
						event: inviteEvent.event,
					},
					statusCode: 200,
				};
			} catch (error) {
				if (error instanceof NotAllowedError) {
					return {
						body: {
							errcode: 'M_FORBIDDEN',
							error: 'This server does not allow joining this type of room based on federation settings.',
						},
						statusCode: 403,
					};
				}

				logger.error({ msg: 'Error processing invite', err: error });

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
