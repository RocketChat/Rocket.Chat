import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
	coerceTypes: true,
	allowUnionTypes: true,
	code: { source: true },
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

type BadRequestErrorResponse = {
	success: false;
	error?: string;
	errorType?: string;
	stack?: string;
	details?: string | object;
};

const BadRequestErrorResponseSchema = {
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [false] },
		stack: { type: 'string' },
		error: { type: 'string' },
		errorType: { type: 'string' },
		details: { anyOf: [{ type: 'string' }, { type: 'object' }] },
	},
	required: ['success'],
	additionalProperties: false,
};

export const validateBadRequestErrorResponse = ajv.compile<BadRequestErrorResponse>(BadRequestErrorResponseSchema);

type UnauthorizedErrorResponse = {
	success: false;
	status?: string;
	message?: string;
	error?: string;
	errorType?: string;
};

const UnauthorizedErrorResponseSchema = {
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [false] },
		status: { type: 'string' },
		message: { type: 'string' },
		error: { type: 'string' },
		errorType: { type: 'string' },
	},
	required: ['success'],
	additionalProperties: false,
};

export const validateUnauthorizedErrorResponse = ajv.compile<UnauthorizedErrorResponse>(UnauthorizedErrorResponseSchema);

export type ForbiddenErrorResponse = {
	success: false;
	status?: string;
	message?: string;
	error?: string;
	errorType?: string;
};

const ForbiddenErrorResponseSchema = {
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [false] },
		status: { type: 'string' },
		message: { type: 'string' },
		error: { type: 'string' },
		errorType: { type: 'string' },
	},
	required: ['success'],
	additionalProperties: false,
};

export const validateForbiddenErrorResponse = ajv.compile<ForbiddenErrorResponse>(ForbiddenErrorResponseSchema);
