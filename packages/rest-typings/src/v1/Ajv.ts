import type { ValidateFunction } from 'ajv';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as z from 'zod';

const ajv = new Ajv({
	coerceTypes: true,
	allowUnionTypes: true,
	code: { source: true },
	discriminator: true,
});

// TODO: keep ajv extension here
addFormats(ajv);

ajv.addFormat('basic_email', /^[^@]+@[^@]+$/);
ajv.addFormat(
	'rfc_email',
	/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
);
ajv.addKeyword({
	keyword: 'isNotEmpty',
	type: 'string',
	validate: (_schema: unknown, data: unknown): boolean => typeof data === 'string' && !!data.trim(),
});
export { ajv };

const createValidatorFor = <Z extends z.ZodType>(schema: Z): ValidateFunction<z.infer<Z>> =>
	ajv.compile<z.infer<Z>>(schema.toJSONSchema({ target: 'openapi-3.0', io: 'input' }));

export const SuccessResponseSchema = z.object({
	success: z.literal(true).meta({ description: 'Indicates whether the request was successful.' }),
});

export const FailureResponseSchema = z.object({
	success: z.literal(false),
});

export const BadRequestErrorResponseSchema = FailureResponseSchema.extend({
	error: z.string().optional(),
	errorType: z.string().optional(),
	stack: z.string().optional(),
	details: z.union([z.string(), z.record(z.any(), z.any())]).optional(),
});

export const UnauthorizedErrorResponseSchema = FailureResponseSchema.extend({
	error: z.string().optional(),
	errorType: z.string().optional(),
	status: z.string().optional(),
	message: z.string().optional(),
});

export const ForbiddenErrorResponseSchema = FailureResponseSchema.extend({
	error: z.string().optional(),
	errorType: z.string().optional(),
	status: z.string().optional(),
	message: z.string().optional(),
});

export const NotFoundErrorResponseSchema = FailureResponseSchema.extend({
	error: z.string(),
});

export const validateBadRequestErrorResponse = createValidatorFor(BadRequestErrorResponseSchema);
export const validateUnauthorizedErrorResponse = createValidatorFor(UnauthorizedErrorResponseSchema);
export const validateForbiddenErrorResponse = createValidatorFor(ForbiddenErrorResponseSchema);
