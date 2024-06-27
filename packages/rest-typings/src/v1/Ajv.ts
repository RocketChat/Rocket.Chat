import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
	coerceTypes: true,
});

addFormats(ajv);

ajv.addFormat('basic_email', /^[^@]+@[^@]+$/);
ajv.addFormat(
	'rfc_email',
	/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
);

export { ajv };
