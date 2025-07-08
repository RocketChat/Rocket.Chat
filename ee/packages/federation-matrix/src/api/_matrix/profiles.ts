import type { Router } from "@rocket.chat/http-router";
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';
import { getAllServicesFromFederationSDK } from '../../setupContainers';

const UsernameSchema = {
    type: 'string',
    pattern: '^@[A-Za-z0-9_=\\/.+-]+:(.+)$',
    description: 'Matrix user ID in format @user:server.com'
};

const RoomIdSchema = {
    type: 'string',
    pattern: '^![A-Za-z0-9_=\\/.+-]+:(.+)$',
    description: 'Matrix room ID in format !room:server.com'
};

const TimestampSchema = {
    type: 'number',
    minimum: 0,
    description: 'Unix timestamp in milliseconds'
};

const ServerNameSchema = {
    type: 'string',
    description: 'Matrix server name'
};

const QueryProfileQuerySchema = {
    type: 'object',
    properties: {
        user_id: UsernameSchema
    },
    required: ['user_id'],
    additionalProperties: false
};

const isQueryProfileQueryProps = ajv.compile(QueryProfileQuerySchema);

const QueryProfileResponseSchema = {
    type: 'object',
    properties: {
        displayname: {
            type: 'string',
            description: 'User display name',
            nullable: true
        },
        avatar_url: {
            type: 'string',
            description: 'User avatar URL',
            nullable: true
        }
    },
    additionalProperties: false
};

const isQueryProfileResponseProps = ajv.compile(QueryProfileResponseSchema);

const QueryKeysBodySchema = {
    type: 'object',
    properties: {
        device_keys: {
            type: 'object',
            additionalProperties: {
                type: 'string'
            },
            description: 'Device keys to query'
        }
    },
    required: ['device_keys'],
    additionalProperties: false
};

const isQueryKeysBodyProps = ajv.compile(QueryKeysBodySchema);

const QueryKeysResponseSchema = {
    type: 'object',
    properties: {
        device_keys: {
            type: 'object',
            additionalProperties: true,
            description: 'Device keys for the requested users'
        }
    },
    required: ['device_keys'],
    additionalProperties: false
};

const isQueryKeysResponseProps = ajv.compile(QueryKeysResponseSchema);

const GetDevicesParamsSchema = {
    type: 'object',
    properties: {
        userId: UsernameSchema
    },
    required: ['userId'],
    additionalProperties: false
};

const isGetDevicesParamsProps = ajv.compile(GetDevicesParamsSchema);

const GetDevicesResponseSchema = {
    type: 'object',
    properties: {
        user_id: UsernameSchema,
        stream_id: {
            type: 'number',
            description: 'Device list stream ID'
        },
        devices: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    device_id: {
                        type: 'string',
                        description: 'Device ID'
                    },
                    display_name: {
                        type: 'string',
                        description: 'Device display name',
                        nullable: true
                    },
                    last_seen_ip: {
                        type: 'string',
                        description: 'Last seen IP address',
                        nullable: true
                    },
                    last_seen_ts: {
                        ...TimestampSchema,
                        nullable: true
                    }
                },
                required: ['device_id'],
                additionalProperties: false
            },
            description: 'List of devices for the user'
        }
    },
    required: ['user_id', 'stream_id', 'devices'],
    additionalProperties: false
};

const isGetDevicesResponseProps = ajv.compile(GetDevicesResponseSchema);

const MakeJoinParamsSchema = {
    type: 'object',
    properties: {
        roomId: RoomIdSchema,
        userId: UsernameSchema
    },
    required: ['roomId', 'userId'],
    additionalProperties: false
};

const isMakeJoinParamsProps = ajv.compile(MakeJoinParamsSchema);

const MakeJoinQuerySchema = {
    type: 'object',
    properties: {
        ver: {
            type: 'array',
            items: {
                type: 'string'
            },
            description: 'Supported room versions',
            nullable: true
        }
    },
    additionalProperties: false
};

const isMakeJoinQueryProps = ajv.compile(MakeJoinQuerySchema);

const MakeJoinResponseSchema = {
    type: 'object',
    properties: {
        room_version: {
            type: 'string',
            description: 'Room version'
        },
        event: {
            type: 'object',
            properties: {
                content: {
                    type: 'object',
                    properties: {
                        membership: {
                            type: 'string',
                            const: 'join'
                        },
                        join_authorised_via_users_server: {
                            type: 'string',
                            nullable: true
                        }
                    },
                    required: ['membership'],
                    additionalProperties: false
                },
                room_id: RoomIdSchema,
                sender: UsernameSchema,
                state_key: UsernameSchema,
                type: {
                    type: 'string',
                    const: 'm.room.member'
                },
                origin_server_ts: TimestampSchema,
                origin: ServerNameSchema,
                depth: {
                    type: 'number',
                    description: 'Depth of the event in the DAG',
                    nullable: true
                },
                prev_events: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: 'Previous events in the room',
                    nullable: true
                },
                auth_events: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: 'Authorization events',
                    nullable: true
                },
                hashes: {
                    type: 'object',
                    properties: {
                        sha256: {
                            type: 'string',
                            description: 'SHA256 hash of the event'
                        }
                    },
                    required: ['sha256'],
                    additionalProperties: false,
                    nullable: true
                },
                signatures: {
                    type: 'object',
                    additionalProperties: {
                        type: 'object',
                        additionalProperties: {
                            type: 'string'
                        }
                    },
                    description: 'Event signatures by server and key ID',
                    nullable: true
                },
                unsigned: {
                    type: 'object',
                    additionalProperties: true,
                    description: 'Unsigned data',
                    nullable: true
                }
            },
            required: ['content', 'room_id', 'sender', 'state_key', 'type', 'origin_server_ts', 'origin'],
            additionalProperties: false
        }
    },
    required: ['room_version', 'event'],
    additionalProperties: false
};

const isMakeJoinResponseProps = ajv.compile(MakeJoinResponseSchema);

const GetMissingEventsParamsSchema = {
    type: 'object',
    properties: {
        roomId: RoomIdSchema
    },
    required: ['roomId'],
    additionalProperties: false
};

const isGetMissingEventsParamsProps = ajv.compile(GetMissingEventsParamsSchema);

const GetMissingEventsBodySchema = {
    type: 'object',
    properties: {
        earliest_events: {
            type: 'array',
            items: {
                type: 'string'
            },
            description: 'Earliest events'
        },
        latest_events: {
            type: 'array',
            items: {
                type: 'string'
            },
            description: 'Latest events'
        },
        limit: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            description: 'Maximum number of events to return'
        }
    },
    required: ['earliest_events', 'latest_events', 'limit'],
    additionalProperties: false
};

const isGetMissingEventsBodyProps = ajv.compile(GetMissingEventsBodySchema);

const GetMissingEventsResponseSchema = {
    type: 'object',
    properties: {
        events: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: true
            },
            description: 'Missing events'
        }
    },
    required: ['events'],
    additionalProperties: false
};

const isGetMissingEventsResponseProps = ajv.compile(GetMissingEventsResponseSchema);

const EventAuthParamsSchema = {
    type: 'object',
    properties: {
        roomId: RoomIdSchema,
        eventId: {
            type: 'string',
            description: 'Event ID'
        }
    },
    required: ['roomId', 'eventId'],
    additionalProperties: false
};

const isEventAuthParamsProps = ajv.compile(EventAuthParamsSchema);

const EventAuthResponseSchema = {
    type: 'object',
    properties: {
        auth_chain: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: true
            },
            description: 'Authorization chain for the event'
        }
    },
    required: ['auth_chain'],
    additionalProperties: false
};

const isEventAuthResponseProps = ajv.compile(EventAuthResponseSchema);

export const getMatrixProfilesRoutes = (router: Router<'/_matrix'>) => {
    const { profiles } = getAllServicesFromFederationSDK();
    
    return router
        .get('/federation/v1/query/profile', {
            query: isQueryProfileQueryProps,
            response: {
                200: isQueryProfileResponseProps
            },
            tags: ['Federation'],
            license: ['federation']
        }, async (c) => {
            const { user_id } = c.req.query();
            
            const response = await profiles.queryProfile(user_id);
            
            return {
                body: response,
                statusCode: 200,
            };
        })
        .post('/federation/v1/user/keys/query', {
            body: isQueryKeysBodyProps,
            response: {
                200: isQueryKeysResponseProps
            },
            tags: ['Federation'],
            license: ['federation']
        }, async (c) => {
            const body = await c.req.json();
            
            const response = await profiles.queryKeys(body.device_keys);
            
            return {
                body: response,
                statusCode: 200,
            };
        })
        .get('/federation/v1/user/devices/:userId', {
            params: isGetDevicesParamsProps,
            response: {
                200: isGetDevicesResponseProps
            },
            tags: ['Federation'],
            license: ['federation']
        }, async (c) => {
            const { userId } = c.req.param();
            
            const response = await profiles.getDevices(userId);
            
            return {
                body: response,
                statusCode: 200,
            };
        })
        .get('/federation/v1/make_join/:roomId/:userId', {
            params: isMakeJoinParamsProps,
            query: isMakeJoinQueryProps,
            response: {
                200: isMakeJoinResponseProps
            },
            tags: ['Federation'],
            license: ['federation']
        }, async (c) => {
            const { roomId, userId } = c.req.param();
            const { ver } = c.req.query();
            
            const response = await profiles.makeJoin(roomId, userId, ver);
            
            return {
                body: {
                    room_version: response.room_version,
                    event: {
                        ...response.event,
                        content: {
                            ...response.event.content,
                            membership: 'join',
                            join_authorised_via_users_server: response.event.content.join_authorised_via_users_server,
                        },
                        room_id: response.event.room_id,
                        sender: response.event.sender,
                        state_key: response.event.state_key,
                        type: 'm.room.member',
                        origin_server_ts: response.event.origin_server_ts,
                        origin: response.event.origin,
                    },
                },
                statusCode: 200,
            };
        })
        .post('/federation/v1/get_missing_events/:roomId', {
            params: isGetMissingEventsParamsProps,
            body: isGetMissingEventsBodyProps,
            response: {
                200: isGetMissingEventsResponseProps
            },
            tags: ['Federation'],
            license: ['federation']
        }, async (c) => {
            const { roomId } = c.req.param();
            const body = await c.req.json();
            
            const response = await profiles.getMissingEvents(
                roomId,
                body.earliest_events,
                body.latest_events,
                body.limit
            );
            
            return {
                body: response,
                statusCode: 200,
            };
        })
        .get('/federation/v1/event_auth/:roomId/:eventId', {
            params: isEventAuthParamsProps,
            response: {
                200: isEventAuthResponseProps
            },
            tags: ['Federation'],
            license: ['federation']
        }, async (c) => {
            const { roomId, eventId } = c.req.param();
            
            const response = await profiles.eventAuth(roomId, eventId);
            
            return {
                body: response,
                statusCode: 200,
            };
        });
};
