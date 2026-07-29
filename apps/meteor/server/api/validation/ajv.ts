import { schemas } from '@rocket.chat/core-typings';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

const components = schemas.components?.schemas;
if (components) {
	// Patch MessageAttachmentDefault to reject unknown properties so the oneOf
	// discriminator works correctly (otherwise it matches every attachment).
	const mad = components.MessageAttachmentDefault;
	if (mad && typeof mad === 'object' && 'type' in mad) {
		(mad as Record<string, unknown>).additionalProperties = false;
	}

	for (const key in components) {
		if (Object.prototype.hasOwnProperty.call(components, key)) {
			const uri = `#/components/schemas/${key}`;
			ajv.addSchema(components[key], uri);
			ajvQuery.addSchema(components[key], uri);
		}
	}
}
