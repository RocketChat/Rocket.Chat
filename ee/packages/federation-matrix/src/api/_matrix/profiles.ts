import type { HomeserverServices } from '@hs/federation-sdk';
import type { RoomVersion } from '@hs/room';
import { Router } from '@rocket.chat/http-router';
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';

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

const TimestampSchema = {
	type: 'number',
	minimum: 0,
	description: 'Unix timestamp in milliseconds',
};

const ServerNameSchema = {
	type: 'string',
	description: 'Matrix server name',
};

const QueryProfileQuerySchema = {
	type: 'object',
	properties: {
		user_id: UsernameSchema,
	},
	required: ['user_id'],
	additionalProperties: false,
};

const isQueryProfileQueryProps = ajv.compile(QueryProfileQuerySchema);

const QueryProfileResponseSchema = {
	type: 'object',
	properties: {
		displayname: {
			type: 'string',
			description: 'User display name',
			nullable: true,
		},
		avatar_url: {
			type: 'string',
			description: 'User avatar URL',
			nullable: true,
		},
	},
};

const isQueryProfileResponseProps = ajv.compile(QueryProfileResponseSchema);

const QueryKeysBodySchema = {
	type: 'object',
	properties: {
		device_keys: {
			type: 'object',
			description: 'Device keys to query',
		},
	},
	required: ['device_keys'],
};

const isQueryKeysBodyProps = ajv.compile(QueryKeysBodySchema);

const QueryKeysResponseSchema = {
	type: 'object',
	properties: {
		device_keys: {
			type: 'object',
			description: 'Device keys for the requested users',
		},
	},
	required: ['device_keys'],
};

const isQueryKeysResponseProps = ajv.compile(QueryKeysResponseSchema);

const GetDevicesParamsSchema = {
	type: 'object',
	properties: {
		userId: UsernameSchema,
	},
	required: ['userId'],
	additionalProperties: false,
};

const isGetDevicesParamsProps = ajv.compile(GetDevicesParamsSchema);

const GetDevicesResponseSchema = {
	type: 'object',
	properties: {
		user_id: UsernameSchema,
		stream_id: {
			type: 'number',
			description: 'Device list stream ID',
		},
		devices: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					device_id: {
						type: 'string',
						description: 'Device ID',
					},
					display_name: {
						type: 'string',
						description: 'Device display name',
						nullable: true,
					},
					last_seen_ip: {
						type: 'string',
						description: 'Last seen IP address',
						nullable: true,
					},
					last_seen_ts: {
						...TimestampSchema,
						nullable: true,
					},
				},
				required: ['device_id'],
			},
			description: 'List of devices for the user',
		},
	},
	required: ['user_id', 'stream_id', 'devices'],
};

const isGetDevicesResponseProps = ajv.compile(GetDevicesResponseSchema);

const MakeJoinParamsSchema = {
	type: 'object',
	properties: {
		roomId: RoomIdSchema,
		userId: UsernameSchema,
	},
	required: ['roomId', 'userId'],
};

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isMakeJoinParamsProps = ajv.compile(MakeJoinParamsSchema);

const MakeJoinQuerySchema = {
	type: 'object',
	properties: {
		ver: {
			type: 'array',
			items: {
				type: 'string',
			},
			minItems: 0,
			description: 'Supported room versions',
		},
	},
};

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isMakeJoinQueryProps = ajv.compile(MakeJoinQuerySchema);

const MakeJoinResponseSchema = {
	type: 'object',
	properties: {
		room_version: {
			type: 'string',
			description: 'Room version',
		},
		event: {
			type: 'object',
			properties: {
				content: {
					type: 'object',
					properties: {
						membership: {
							type: 'string',
							const: 'join',
						},
						join_authorised_via_users_server: {
							type: 'string',
							nullable: true,
						},
					},
					required: ['membership'],
				},
				room_id: RoomIdSchema,
				sender: UsernameSchema,
				state_key: UsernameSchema,
				type: {
					type: 'string',
					const: 'm.room.member',
				},
				origin_server_ts: TimestampSchema,
				origin: ServerNameSchema,
				depth: {
					type: 'number',
					description: 'Depth of the event in the DAG',
					nullable: true,
				},
				prev_events: {
					type: 'array',
					items: {
						type: 'string',
					},
					description: 'Previous events in the room',
					nullable: true,
				},
				auth_events: {
					type: 'array',
					items: {
						type: 'string',
					},
					description: 'Authorization events',
					nullable: true,
				},
				hashes: {
					type: 'object',
					properties: {
						sha256: {
							type: 'string',
							description: 'SHA256 hash of the event',
						},
					},
					required: ['sha256'],
					nullable: true,
				},
				signatures: {
					type: 'object',
					description: 'Event signatures by server and key ID',
					nullable: true,
				},
				unsigned: {
					type: 'object',
					description: 'Unsigned data',
					nullable: true,
				},
			},
			required: ['content', 'room_id', 'sender', 'state_key', 'type', 'origin_server_ts', 'origin'],
		},
	},
	required: ['room_version', 'event'],
};

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isMakeJoinResponseProps = ajv.compile(MakeJoinResponseSchema);

const GetMissingEventsParamsSchema = {
	type: 'object',
	properties: {
		roomId: RoomIdSchema,
	},
	required: ['roomId'],
};

const isGetMissingEventsParamsProps = ajv.compile(GetMissingEventsParamsSchema);

const GetMissingEventsBodySchema = {
	type: 'object',
	properties: {
		earliest_events: {
			type: 'array',
			items: {
				type: 'string',
			},
			description: 'Earliest events',
		},
		latest_events: {
			type: 'array',
			items: {
				type: 'string',
			},
			description: 'Latest events',
		},
		limit: {
			type: 'number',
			minimum: 1,
			maximum: 100,
			description: 'Maximum number of events to return',
		},
	},
	required: ['earliest_events', 'latest_events', 'limit'],
};

const isGetMissingEventsBodyProps = ajv.compile(GetMissingEventsBodySchema);

const GetMissingEventsResponseSchema = {
	type: 'object',
	properties: {
		events: {
			type: 'array',
			items: {
				type: 'object',
			},
			description: 'Missing events',
		},
	},
	required: ['events'],
};

const isGetMissingEventsResponseProps = ajv.compile(GetMissingEventsResponseSchema);

const EventAuthParamsSchema = {
	type: 'object',
	properties: {
		roomId: RoomIdSchema,
		eventId: {
			type: 'string',
			description: 'Event ID',
		},
	},
	required: ['roomId', 'eventId'],
};

const isEventAuthParamsProps = ajv.compile(EventAuthParamsSchema);

const EventAuthResponseSchema = {
	type: 'object',
	properties: {
		auth_chain: {
			type: 'array',
			items: {
				type: 'object',
			},
			description: 'Authorization chain for the event',
		},
	},
	required: ['auth_chain'],
};

const isEventAuthResponseProps = ajv.compile(EventAuthResponseSchema);

export const getMatrixProfilesRoutes = (services: HomeserverServices) => {
	const { profile } = services;

	return new Router('/federation')
		.get(
			'/v1/query/profile',
			{
				query: isQueryProfileQueryProps,
				response: {
					200: isQueryProfileResponseProps,
				},
				tags: ['Federation'],
				license: ['federation'],
			},
			async (c) => {
				const { user_id: userId } = c.req.query();

				const response = await profile.queryProfile(userId);

				return {
					body: response,
					statusCode: 200,
				};
			},
		)
		.post(
			'/v1/user/keys/query',
			{
				body: isQueryKeysBodyProps,
				response: {
					200: isQueryKeysResponseProps,
				},
				tags: ['Federation'],
				license: ['federation'],
			},
			async (c) => {
				const body = await c.req.json();

				const response = await profile.queryKeys(body.device_keys);

				return {
					body: response,
					statusCode: 200,
				};
			},
		)
		.get(
			'/v1/user/devices/:userId',
			{
				params: isGetDevicesParamsProps,
				response: {
					200: isGetDevicesResponseProps,
				},
				tags: ['Federation'],
				license: ['federation'],
			},
			async (c) => {
				const { userId } = c.req.param();

				const response = await profile.getDevices(userId);

				return {
					body: response,
					statusCode: 200,
				};
			},
		)
		.get(
			'/v1/make_join/:roomId/:userId',
			{
				// TODO: fix types here, likely import from room package
				params: ajv.compile({ type: 'object' }),
				query: ajv.compile({ type: 'object' }),
				response: {
					200: ajv.compile({ type: 'object' }),
				},
				tags: ['Federation'],
				license: ['federation'],
			},
			async (c) => {
				const { roomId, userId } = c.req.param();
				const url = new URL(c.req.url);
				const verParams = url.searchParams.getAll('ver');

				const response = await profile.makeJoin(roomId, userId, verParams.length > 0 ? (verParams as RoomVersion[]) : ['1']);

				return {
					body: {
						room_version: response.room_version,
						event: response.event,
					},
					statusCode: 200,
				};
			},
		)
		.post(
			'/v1/get_missing_events/:roomId',
			{
				params: isGetMissingEventsParamsProps,
				body: isGetMissingEventsBodyProps,
				response: {
					200: isGetMissingEventsResponseProps,
				},
				tags: ['Federation'],
				license: ['federation'],
			},
			async (c) => {
				const { roomId } = c.req.param();
				const body = await c.req.json();

				const response = await profile.getMissingEvents(roomId, body.earliest_events, body.latest_events, body.limit);

				return {
					body: response,
					statusCode: 200,
				};
			},
		)
		.get(
			'/v1/event_auth/:roomId/:eventId',
			{
				params: isEventAuthParamsProps,
				response: {
					200: isEventAuthResponseProps,
				},
				tags: ['Federation'],
				license: ['federation'],
			},
			async (c) => {
				const { roomId, eventId } = c.req.param();

				const response = await profile.eventAuth(roomId, eventId);

				return {
					body: response,
					statusCode: 200,
				};
			},
		);
};
