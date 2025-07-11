import { schemas } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
	allowUnionTypes: true,
	code: { source: true },
});

export { ajv };

const components = schemas.components?.schemas;

if (components) {
	for (const key in components) {
		if (Object.prototype.hasOwnProperty.call(components, key)) {
			ajv.addSchema(components[key], `#/components/schemas/${key}`);
		}
	}
}
