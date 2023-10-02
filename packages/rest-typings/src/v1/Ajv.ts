import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
	coerceTypes: true,
});
addFormats(ajv);

export { ajv };
