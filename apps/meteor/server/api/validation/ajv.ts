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

	// typia collapses the `InternalModuleName | ExternalModuleName` union into a single
	// string schema carrying both `enum` and `pattern`, which can never match any value.
	// Split it back into an `anyOf` so both internal names and external `a.b` ids validate.
	const lm = components.LicenseModule as { enum?: unknown; pattern?: unknown } | undefined;
	if (lm && typeof lm === 'object' && Array.isArray(lm.enum) && typeof lm.pattern === 'string') {
		components.LicenseModule = {
			anyOf: [
				{ type: 'string', enum: lm.enum },
				{ type: 'string', pattern: lm.pattern },
			],
		};
	}

	for (const key in components) {
		if (Object.prototype.hasOwnProperty.call(components, key)) {
			const uri = `#/components/schemas/${key}`;
			ajv.addSchema(components[key], uri);
			ajvQuery.addSchema(components[key], uri);
		}
	}
}
