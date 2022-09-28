import Ajv from 'ajv';

export const ajv = new Ajv({
	coerceTypes: true,
	allowUnionTypes: true,
	allErrors: true,
});
