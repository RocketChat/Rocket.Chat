import { schemas } from '@rocket.chat/core-typings';
import { ajv } from '@rocket.chat/rest-typings';

const components = schemas.components?.schemas;
if (components) {
	for (const key in components) {
		if (Object.prototype.hasOwnProperty.call(components, key)) {
			ajv.addSchema(components[key], `#/components/schemas/${key}`);
		}
	}
}
