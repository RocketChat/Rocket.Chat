import type { IAbacAttribute, IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { AbacEndpoints } from '.';

const ajv = new Ajv({
	coerceTypes: true,
});

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends AbacEndpoints {}
}

const GenericSuccess = {
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	additionalProperties: false,
};

export const GenericSuccessSchema = ajv.compile<void>(GenericSuccess);

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
