import Ajv from 'ajv';

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

export const POSTAbacAttributeDefinitionSchema = ajv.compile<void>(AbacAttributeDefinition);
