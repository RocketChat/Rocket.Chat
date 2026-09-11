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
		const typeEnum = (props?.type as { enum?: unknown[] } | undefined)?.enum;
		const isFileBranch = Array.isArray(typeEnum) && typeEnum.length === 1 && typeEnum[0] === 'file';
		const hasMediaUrl = !!props && ('image_url' in props || 'video_url' in props || 'audio_url' in props);
		if (isFileBranch && !hasMediaUrl) {
			(schema as Record<string, unknown>).additionalProperties = false;
		}
	}

	for (const key in components) {
		if (Object.prototype.hasOwnProperty.call(components, key)) {
			const uri = `#/components/schemas/${key}`;
			ajv.addSchema(components[key], uri);
			ajvQuery.addSchema(components[key], uri);
		}
	}
}
