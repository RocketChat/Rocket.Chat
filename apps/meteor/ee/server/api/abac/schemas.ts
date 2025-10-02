import type { IAbacAttribute, IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

// Removed AbacEndpoints import to avoid circular type reference (endpoints import these schemas)

const ajv = new Ajv({
	coerceTypes: true,
});

// Omitted module augmentation to prevent circular reference with endpoint definitions

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
		key: { type: 'string', minLength: 1, pattern: '^[A-Za-z0-9_-]+$' },
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			minItems: 1,
			maxItems: 10,
			uniqueItems: true,
		},
	},
	additionalProperties: false,
	anyOf: [{ required: ['key'] }, { required: ['values'] }],
};

export const PUTAbacAttributeUpdateBodySchema = ajv.compile<IAbacAttributeDefinition>(UpdateAbacAttributeBody);
// Create an abac attribute using the IAbacAttributeDefintion type, create the ajv schemas

const AbacAttributeDefinition = {
	type: 'object',
	properties: {
		key: { type: 'string', minLength: 1 },
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			minItems: 1,
			maxItems: 10,
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
		key: { type: 'string', minLength: 1 },
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			minItems: 1,
			maxItems: 10,
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
		key: { type: 'string', minLength: 1 },
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			minItems: 1,
			maxItems: 10,
			uniqueItems: true,
		},
	},
	required: ['_id', 'key', 'values'],
	additionalProperties: false,
};

// Response schema for listing attributes with pagination metadata
const GetAbacAttributesResponse = {
	type: 'object',
	properties: {
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
		key: { type: 'string', minLength: 1 },
		values: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			minItems: 1,
			maxItems: 10,
			uniqueItems: true,
		},
		usage: {
			type: 'object',
			additionalProperties: { type: 'boolean' },
		},
	},
	required: ['attribute', 'usage'],
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
			propertyNames: { type: 'string', pattern: '^[A-Za-z0-9_-]+$' },
			additionalProperties: {
				type: 'array',
				items: { type: 'string', minLength: 1 },
				uniqueItems: true,
			},
		},
	},
	required: ['attributes'],
	additionalProperties: false,
};

export const POSTRoomAbacAttributesBodySchema = ajv.compile<{ attributes: Record<string, string[]> }>(PostRoomAbacAttributesBody);
