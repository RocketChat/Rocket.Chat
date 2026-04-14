import { schemas } from '@rocket.chat/core-typings';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

const components = schemas.components?.schemas;
if (components) {
	for (const key in components) {
		if (Object.prototype.hasOwnProperty.call(components, key)) {
			const uri = `#/components/schemas/${key}`;
			ajv.addSchema(components[key], uri);
			ajvQuery.addSchema(components[key], uri);
		}
	}
}
