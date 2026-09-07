import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';

/**
 * Turns the API's `abacAttributes` map into the shape stored on a room, ready to be merged into the
 * extra data `createRoom` writes (ABAC-P4 M4).
 *
 * Returns an empty object rather than an empty array when nothing was supplied, so the caller can
 * spread it without writing `abacAttributes: []` onto rooms that have none — an empty array and an
 * absent field mean the same thing to the locked predicate, but only the absent field leaves
 * non-ABAC rooms untouched.
 */
export const toAbacAttributeDefinitions = (attributes?: Record<string, string[]>): { abacAttributes?: IAbacAttributeDefinition[] } => {
	if (!attributes) {
		return {};
	}

	const definitions = Object.entries(attributes)
		.map(([key, values]) => ({ key: key.trim(), values }))
		.filter(({ key, values }) => key.length > 0 && values.length > 0);

	return definitions.length ? { abacAttributes: definitions } : {};
};
