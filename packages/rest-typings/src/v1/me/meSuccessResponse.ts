import type { IMeApiUser } from '@rocket.chat/core-typings';

/**
 * GET /api/v1/me success body: {@link IMeApiUser} flattened with `success: true` (API.v1.success).
 *
 * NOTE: This schema uses $ref to IMeApiUser which is registered at runtime via ajv.addSchema().
 * Do NOT compile this schema here — it must be compiled in the route file (misc.ts) where
 * the $ref schemas are already registered.
 */
export type MeApiSuccessResponse = IMeApiUser & { success: true };

export const meSuccessResponseSchema = {
	type: 'object',
	allOf: [
		{ $ref: '#/components/schemas/IMeApiUser' },
		{ type: 'object', properties: { success: { type: 'boolean', enum: [true] } }, required: ['success'] },
	],
	unevaluatedProperties: false,
};
