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

	// Lock down the catch-all "plain file" attachment branch. typia emits the
	// FileAttachmentProps union as `(type: 'file') & (video | image | audio | base)`;
	// the base branch only requires `type: 'file'`, so it also matches image/video/audio
	// payloads. That makes the MessageAttachment oneOf ambiguous — a single image
	// attachment satisfies both its specific branch and the base branch, violating
	// oneOf's "exactly one" rule and failing response validation for any message with a
	// file or quoted-file attachment. Reject unknown props on the base branch so only
	// genuine plain-file attachments match it.
	for (const key in components) {
		if (!Object.prototype.hasOwnProperty.call(components, key)) {
			continue;
		}
		const schema = components[key] as { properties?: Record<string, unknown> };
		const props = schema?.properties;
		// typia writes single valued types as `enum: ['file']` for OpenAPI 3.0 and as `const: 'file'`
		// for 3.1, so both spellings have to be recognized
		const typeSchema = props?.type as { enum?: unknown[]; const?: unknown } | undefined;
		const typeValues = typeSchema?.enum ?? (typeSchema && 'const' in typeSchema ? [typeSchema.const] : undefined);
		const isFileBranch = Array.isArray(typeValues) && typeValues.length === 1 && typeValues[0] === 'file';
		const hasMediaUrl = !!props && ('image_url' in props || 'video_url' in props || 'audio_url' in props);
		if (isFileBranch && !hasMediaUrl) {
			(schema as Record<string, unknown>).additionalProperties = false;
		}
	}

	// AJV implements `discriminator` but refuses its `mapping`, which typia emits for OpenAPI 3.1.
	// The mapping is only useful to documentation tools, so it is dropped from the copy AJV compiles
	// and kept in the one the OpenAPI document serializes.
	const forValidation = (schema: unknown): unknown => {
		if (Array.isArray(schema)) {
			return schema.map(forValidation);
		}

		if (!schema || typeof schema !== 'object') {
			return schema;
		}

		return Object.fromEntries(
			Object.entries(schema).map(([key, value]) => [
				key,
				key === 'discriminator' && value && typeof value === 'object'
					? Object.fromEntries(Object.entries(value).filter(([name]) => name !== 'mapping'))
					: forValidation(value),
			]),
		);
	};

	for (const key in components) {
		if (Object.prototype.hasOwnProperty.call(components, key)) {
			const uri = `#/components/schemas/${key}`;
			ajv.addSchema(forValidation(components[key]), uri);
			ajvQuery.addSchema(forValidation(components[key]), uri);
		}
	}
}
