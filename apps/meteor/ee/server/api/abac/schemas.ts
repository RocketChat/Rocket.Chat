import type { IAbacAttribute, IAbacAttributeDefinition, IAuditServerActor, IRoom, IServerEvents } from '@rocket.chat/core-typings';
import type { PaginatedResult, PaginatedRequest } from '@rocket.chat/rest-typings';
import { ajv } from '@rocket.chat/rest-typings';

const ATTRIBUTE_KEY_PATTERN = '^[A-Za-z0-9_-]+$';
const MAX_ROOM_ATTRIBUTE_VALUES = 10;
const MAX_USERS_SYNC_ITEMS = 100;
const MAX_ROOM_ATTRIBUTE_KEYS = 10;

const GenericSuccess = {
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	additionalProperties: false,
};

export const GenericSuccessSchema = ajv.compile<void>(GenericSuccess);

// Update ABAC attribute (request body)
const UpdateAbacAttributeBody = {
	type: 'object',
	properties: {
		key: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
			minItems: 1,
			uniqueItems: true,
		},
	},
	additionalProperties: false,
	anyOf: [{ required: ['key'] }, { required: ['values'] }],
};

export const PUTAbacAttributeUpdateBodySchema = ajv.compile<IAbacAttributeDefinition>(UpdateAbacAttributeBody);

const AbacAttributeDefinition = {
	type: 'object',

	properties: {
		key: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
			minItems: 1,
			uniqueItems: true,
		},
	},
	required: ['key', 'values'],
	additionalProperties: false,
};

export const POSTAbacAttributeDefinitionSchema = ajv.compile<IAbacAttributeDefinition>(AbacAttributeDefinition);

const GetAbacAttributesQuery = {
	type: 'object',
	properties: {
		key: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
		values: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
		offset: { type: 'number' },
		count: { type: 'number' },
	},
	additionalProperties: false,
};

export const GETAbacAttributesQuerySchema = ajv.compile<{ key?: string; values?: string; offset: number; count?: number }>(
	GetAbacAttributesQuery,
);

const AbacAttributeRecord = {
	type: 'object',
	properties: {
		_id: { type: 'string', minLength: 1 },
		key: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
			minItems: 1,
			uniqueItems: true,
		},
	},
	required: ['_id', 'key', 'values'],
	additionalProperties: false,
};

const GetAbacAttributesResponse = {
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
		attributes: {
			type: 'array',
			items: AbacAttributeRecord,
		},
		offset: { type: 'number' },
		count: { type: 'number' },
		total: { type: 'number' },
	},
	required: ['attributes', 'offset', 'count', 'total'],
	additionalProperties: false,
};

export const GETAbacAttributesResponseSchema = ajv.compile<{
	attributes: IAbacAttribute[];
	offset: number;
	count: number;
	total: number;
}>(GetAbacAttributesResponse);

const GetAbacAttributeByIdResponse = {
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
		_id: { type: 'string', minLength: 1 },
		key: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
			minItems: 1,
			uniqueItems: true,
		},
	},
	required: ['key', 'values'],
	additionalProperties: false,
};

export const GETAbacAttributeByIdResponseSchema = ajv.compile<{
	key: string;
	values: string[];
}>(GetAbacAttributeByIdResponse);

const GetAbacAttributeIsInUseResponse = {
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
		inUse: { type: 'boolean' },
	},
	required: ['inUse'],
	additionalProperties: false,
};

export const GETAbacAttributeIsInUseResponseSchema = ajv.compile<{ inUse: boolean }>(GetAbacAttributeIsInUseResponse);

const GetAbacAuditEventsQuerySchemaObject = {
	type: 'object',
	properties: {
		start: { type: 'string', format: 'date-time', nullable: true },
		end: { type: 'string', format: 'date-time', nullable: true },
		offset: { type: 'number', nullable: true },
		count: { type: 'number', nullable: true },
		actor: {
			type: 'object',
			nullable: true,
			properties: {
				type: {
					type: 'string',
					nullable: true,
				},
				_id: {
					type: 'string',
					nullable: true,
				},
				username: {
					type: 'string',
					nullable: true,
				},
				ip: {
					type: 'string',
					nullable: true,
				},
				useragent: {
					type: 'string',
					nullable: true,
				},
				reason: {
					type: 'string',
					nullable: true,
				},
			},
		},
	},
	additionalProperties: false,
};

export const GETAbacAuditEventsQuerySchema = ajv.compile<
	PaginatedRequest<{
		start?: string;
		end?: string;
		actor?: IAuditServerActor;
	}>
>(GetAbacAuditEventsQuerySchemaObject);

const GetAbacAuditEventsResponseSchemaObject = {
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
		events: {
			type: 'array',
			items: {
				type: 'object',
			},
		},
		count: {
			type: 'number',
			description: 'The number of events returned in this response.',
		},
		offset: {
			type: 'number',
			description: 'The number of events that were skipped in this response.',
		},
		total: {
			type: 'number',
			description: 'The total number of events that match the query.',
		},
	},
	required: ['events', 'count', 'offset', 'total'],
	additionalProperties: false,
};

export const GETAbacAuditEventsResponseSchema = ajv.compile<{
	events: (
		| IServerEvents['abac.action.performed']
		| IServerEvents['abac.attribute.changed']
		| IServerEvents['abac.object.attribute.changed']
		| IServerEvents['abac.object.attributes.removed']
	)[];
	count: number;
	offset: number;
	total: number;
}>(GetAbacAuditEventsResponseSchemaObject);

const PostRoomAbacAttributesBody = {
	type: 'object',
	properties: {
		attributes: {
			type: 'object',
			propertyNames: { type: 'string', pattern: ATTRIBUTE_KEY_PATTERN },
			minProperties: 1,
			maxProperties: MAX_ROOM_ATTRIBUTE_KEYS,
			additionalProperties: {
				type: 'array',
				items: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
				maxItems: MAX_ROOM_ATTRIBUTE_VALUES,
				uniqueItems: true,
			},
		},
	},
	required: ['attributes'],
	additionalProperties: false,
};

export const POSTRoomAbacAttributesBodySchema = ajv.compile<{ attributes: Record<string, string[]> }>(PostRoomAbacAttributesBody);

const PostSingleRoomAbacAttributeBody = {
	type: 'object',
	properties: {
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
			minItems: 1,
			maxItems: MAX_ROOM_ATTRIBUTE_VALUES,
			uniqueItems: true,
		},
	},
	required: ['values'],
	additionalProperties: false,
};

export const POSTSingleRoomAbacAttributeBodySchema = ajv.compile<{ values: string[] }>(PostSingleRoomAbacAttributeBody);

const PutRoomAbacAttributeValuesBody = {
	type: 'object',
	properties: {
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
			minItems: 1,
			maxItems: MAX_ROOM_ATTRIBUTE_VALUES,
			uniqueItems: true,
		},
	},
	required: ['values'],
	additionalProperties: false,
};

export const PUTRoomAbacAttributeValuesBodySchema = ajv.compile<{ values: string[] }>(PutRoomAbacAttributeValuesBody);

const GenericError = {
	type: 'object',
	properties: {
		success: {
			type: 'boolean',
		},
		message: {
			type: 'string',
		},
	},
};

const PostAbacUsersSyncBody = {
	type: 'object',
	properties: {
		usernames: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			minItems: 1,
			maxItems: MAX_USERS_SYNC_ITEMS,
			uniqueItems: true,
		},
		ids: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			minItems: 1,
			maxItems: MAX_USERS_SYNC_ITEMS,
			uniqueItems: true,
		},
		emails: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			minItems: 1,
			maxItems: MAX_USERS_SYNC_ITEMS,
			uniqueItems: true,
		},
		ldapIds: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			minItems: 1,
			maxItems: MAX_USERS_SYNC_ITEMS,
			uniqueItems: true,
		},
	},
	additionalProperties: false,
	anyOf: [{ required: ['usernames'] }, { required: ['ids'] }, { required: ['emails'] }, { required: ['ldapIds'] }],
};

export const POSTAbacUsersSyncBodySchema = ajv.compile<{
	usernames?: string[];
	ids?: string[];
	emails?: string[];
	ldapIds?: string[];
}>(PostAbacUsersSyncBody);

export const GenericErrorSchema = ajv.compile<{ success: boolean; message: string }>(GenericError);

const GETAbacRoomsListQuerySchema = {
	type: 'object',
	properties: {
		filter: { type: 'string', minLength: 1 },
		filterType: { type: 'string', enum: ['all', 'roomName', 'attribute', 'value'] },
		offset: { type: 'number' },
		count: { type: 'number' },
	},
	additionalProperties: false,
};

type GETAbacRoomsListQuery = PaginatedRequest<{ filter?: string; filterType?: 'all' | 'roomName' | 'attribute' | 'value' }>;

export const GETAbacRoomsListQueryValidator = ajv.compile<GETAbacRoomsListQuery>(GETAbacRoomsListQuerySchema);

export const GETAbacRoomsResponseSchema = {
	type: 'object',
	properties: {
		success: {
			type: 'boolean',
			enum: [true],
		},
		rooms: {
			type: 'array',
			items: { type: 'object' },
		},
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
		total: {
			type: 'number',
		},
	},
	required: ['rooms', 'offset', 'count', 'total'],
	additionalProperties: false,
};

type GETAbacRoomsResponse = PaginatedResult<{
	rooms: IRoom[];
}>;

export const GETAbacRoomsResponseValidator = ajv.compile<GETAbacRoomsResponse>(GETAbacRoomsResponseSchema);
