import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export const ajv = new Ajv({
	coerceTypes: true,
});

addFormats(ajv, ['date', 'time']);
