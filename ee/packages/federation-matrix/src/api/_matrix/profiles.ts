import { eventIdSchema, roomIdSchema, userIdSchema, federationSDK, type RoomVersion } from '@rocket.chat/federation-sdk';
import { Router } from '@rocket.chat/http-router';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

import { canAccessResourceMiddleware } from '../middlewares/canAccessResource';
import { isAuthenticatedMiddleware } from '../middlewares/isAuthenticated';

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
		field: {
			// open string, not an enum: the spec defines displayname, avatar_url and m.tz,
			// and servers MAY allow arbitrary additional profile fields
			type: 'string',
			description: 'Profile field to query',
			nullable: true,
		},
	},
	required: ['user_id'],
};

const isQueryProfileQueryProps = ajvQuery.compile(QueryProfileQuerySchema);

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

const isMakeJoinParamsProps = ajv.compile(MakeJoinParamsSchema);

const MakeJoinQuerySchema = {
	type: 'object',
	properties: {
		ver: {
			// a string branch here would be redundant: ajvQuery coerces a single `?ver=` into a
			// one-element array, and in a `oneOf` both branches would match and fail validation
			type: 'array',
			items: {
				type: 'string',
			},
			description: 'Room versions supported by the sending server',
		},
	},
};

const isMakeJoinQueryProps = ajvQuery.compile(MakeJoinQuerySchema);

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

const isMakeJoinResponseProps = ajv.compile(MakeJoinResponseSchema);

const MakeJoinIncompatibleVersionResponseSchema = {
	type: 'object',
	properties: {
		errcode: {
			type: 'string',
			const: 'M_INCOMPATIBLE_ROOM_VERSION',
		},
		error: {
			type: 'string',
		},
		room_version: {
			type: 'string',
			description: 'The version of the room',
		},
	},
	required: ['errcode', 'error', 'room_version'],
};

const isMakeJoinIncompatibleVersionResponseProps = ajv.compile(MakeJoinIncompatibleVersionResponseSchema);

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
			// optional per spec (defaults to 10) and unbounded; the handler applies the default and a cap
			type: 'number',
			description: 'Maximum number of events to return',
			nullable: true,
		},
		min_depth: {
			type: 'number',
			description: 'Minimum depth of events to retrieve (ignored)',
			nullable: true,
		},
	},
	required: ['earliest_events', 'latest_events'],
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

export const getMatrixProfilesRoutes = () => {
	return new Router('/federation')
		.use(isAuthenticatedMiddleware())
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
				const { user_id: userId, field } = c.req.query();

				const response = await federationSDK.queryProfile(userId);

				if (!response) {
					return {
						body: {
							errcode: 'M_NOT_FOUND',
							error: `User ${userId} not found`,
						},
						statusCode: 404,
					};
				}

				if (field) {
					return {
						body: {
							[field]: response[field as 'displayname' | 'avatar_url'] || null,
						},
						statusCode: 200,
					};
				}

				return {
					body: {
						displayname: response.displayname,
						avatar_url: response.avatar_url,
					},
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

				const response = await federationSDK.queryKeys(body.device_keys);

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
				return {
					body: {
						devices: [],
						stream_id: 0,
						user_id: c.req.param('userId'),
					},
					statusCode: 200,
				};
			},
		)
		.get(
			'/v1/make_join/:roomId/:userId',
			{
				params: isMakeJoinParamsProps,
				query: isMakeJoinQueryProps,
				response: {
					200: isMakeJoinResponseProps,
					400: isMakeJoinIncompatibleVersionResponseProps,
				},
				tags: ['Federation'],
				license: ['federation'],
			},
			canAccessResourceMiddleware('room'),
			async (c) => {
				const { roomId, userId } = c.req.param();
				const url = new URL(c.req.url);
				const verParams = url.searchParams.getAll('ver');

				try {
					const response = await federationSDK.makeJoin(
						roomIdSchema.parse(roomId),
						userIdSchema.parse(userId),
						// spec: "The room versions the sending server has support for. Defaults to [1]."
						verParams.length > 0 ? (verParams as RoomVersion[]) : ['1'],
					);

					return {
						body: {
							room_version: response.room_version,
							event: response.event,
						},
						statusCode: 200,
					};
				} catch (error) {
					// the SDK throws when the room's version is not in the requested `ver` list
					const incompatibleVersion = error instanceof Error && error.message.match(/^Unsupported room version: (.+)$/);
					if (incompatibleVersion) {
						return {
							body: {
								errcode: 'M_INCOMPATIBLE_ROOM_VERSION',
								error: 'Your homeserver does not support the features required to join this room',
								room_version: incompatibleVersion[1],
							},
							statusCode: 400,
						};
					}

					throw error;
				}
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
			canAccessResourceMiddleware('room'),
			async (c) => {
				const { roomId } = c.req.param();
				const body = await c.req.json();

				const limit = Math.min(body.limit ?? 10, 100);

				const response = await federationSDK.getMissingEvents(roomIdSchema.parse(roomId), body.earliest_events, body.latest_events, limit);

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
			canAccessResourceMiddleware('room'),
			async (c) => {
				const { roomId, eventId } = c.req.param();

				const response = await federationSDK.eventAuth(roomIdSchema.parse(roomId), eventIdSchema.parse(eventId));

				return {
					body: response,
					statusCode: 200,
				};
			},
		);
};
