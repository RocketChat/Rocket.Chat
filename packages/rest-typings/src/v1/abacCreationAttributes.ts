export type AbacCreationAttributes = Record<string, string[]>;

const ATTRIBUTE_KEY_PATTERN = '^[A-Za-z0-9_-]+$';

export const abacCreationAttributesSchema = {
	type: 'object',
	propertyNames: { type: 'string', pattern: ATTRIBUTE_KEY_PATTERN },
	minProperties: 1,
	maxProperties: 10,
	additionalProperties: {
		type: 'array',
		items: { type: 'string', minLength: 1, pattern: ATTRIBUTE_KEY_PATTERN },
		minItems: 1,
		maxItems: 10,
		uniqueItems: true,
	},
} as const;
