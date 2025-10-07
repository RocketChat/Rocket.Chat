import type { IAbacAttribute, IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ATTRIBUTE_KEY_PATTERN = '^[A-Za-z0-9_-]+$';
const MAX_ATTRIBUTE_VALUES = 10;
const MAX_ROOM_ATTRIBUTE_VALUES = 10;

const ajv = new Ajv({
	coerceTypes: true,
});

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
			maxItems: MAX_ATTRIBUTE_VALUES,
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
			maxItems: MAX_ATTRIBUTE_VALUES,
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
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
			minItems: 1,
			maxItems: MAX_ATTRIBUTE_VALUES,
			uniqueItems: true,
		},
		offset: { type: 'integer', minimum: 0, default: 0 },
		count: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
	},
	additionalProperties: false,
};

export const GETAbacAttributesQuerySchema = ajv.compile<{ key: string; values: string[]; offset: number; count: number; total: number }>(
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
			maxItems: MAX_ATTRIBUTE_VALUES,
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
		offset: { type: 'integer', minimum: 0 },
		count: { type: 'integer', minimum: 0 },
		total: { type: 'integer', minimum: 0 },
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
			maxItems: MAX_ATTRIBUTE_VALUES,
			uniqueItems: true,
		},
		usage: {
			type: 'object',
			additionalProperties: { type: 'boolean' },
		},
	},
	required: ['key', 'values'],
	additionalProperties: false,
};

export const GETAbacAttributeByIdResponseSchema = ajv.compile<{
	key: string;
	values: string[];
	usage: Record<string, boolean>;
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

const PostRoomAbacAttributesBody = {
	type: 'object',
	properties: {
		attributes: {
			type: 'object',
			propertyNames: { type: 'string', pattern: ATTRIBUTE_KEY_PATTERN },
			minProperties: 1,
			maxProperties: MAX_ATTRIBUTE_VALUES,
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

export const GenericErrorSchema = ajv.compile<{ success: boolean; message: string }>(GenericError);
