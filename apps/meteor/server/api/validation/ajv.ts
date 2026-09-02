import { schemas } from '@rocket.chat/core-typings';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';

type SchemaObject = Record<string, unknown>;

/**
 * A patcher inspects one generated component schema and, if it recognizes the branch it is
 * responsible for, tightens it. typia leaves some `oneOf` branches permissive enough that a
 * payload also matches a sibling branch; that breaks `oneOf`'s "exactly one" rule and fails
 * response validation. Each patcher restores unambiguous matching for one such branch.
 *
 * Patchers form a chain: a schema is offered to each in turn until one claims it by returning
 * `true`. The recognized branches are mutually exclusive, so at most one patcher ever applies.
 */
type SchemaPatcher = (key: string, schema: SchemaObject) => boolean;

const getProps = (schema: SchemaObject): SchemaObject | undefined => schema.properties as SchemaObject | undefined;

const rejectUnknownProps = (schema: SchemaObject): true => {
	schema.additionalProperties = false;
	return true;
};

/**
 * `MessageAttachmentDefault` requires nothing specific, so it matches every attachment payload
 * and makes the `MessageAttachment` `oneOf` ambiguous. Reject unknown props so it matches only a
 * genuine default attachment.
 */
const patchMessageAttachmentDefault: SchemaPatcher = (key, schema) => {
	if (key !== 'MessageAttachmentDefault' || !('type' in schema)) {
		return false;
	}
	return rejectUnknownProps(schema);
};

/**
 * The catch-all "plain file" attachment branch. typia emits the `FileAttachmentProps` union as
 * `(type: 'file') & (video | image | audio | base)`; the base branch only requires `type: 'file'`,
 * so it also matches image/video/audio payloads. A single image attachment then satisfies both its
 * specific branch and the base branch, failing response validation for any message with a file or
 * quoted-file attachment. Reject unknown props so only a genuine plain-file attachment matches it.
 */
const patchPlainFileAttachmentBranch: SchemaPatcher = (_key, schema) => {
	const props = getProps(schema);
	const typeEnum = (props?.type as { enum?: unknown[] } | undefined)?.enum;
	const isFileBranch = Array.isArray(typeEnum) && typeEnum.length === 1 && typeEnum[0] === 'file';
	const hasMediaUrl = !!props && ('image_url' in props || 'video_url' in props || 'audio_url' in props);
	if (!isFileBranch || hasMediaUrl) {
		return false;
	}
	return rejectUnknownProps(schema);
};

/**
 * The text-only branch of `CallPreventionRecord` (`IMediaCall.preventedBy`). typia emits the union
 * `{ text } | { text, key, ns, args }` as a `oneOf`. The text-only branch is a subset of the key
 * branch, so a key-variant payload matches both and the `oneOf` rejects it, failing
 * `call-history.info` for every i18n-key prevented call. Reject unknown props so a payload that
 * carries a key no longer matches the text-only branch.
 */
const patchCallPreventionTextBranch: SchemaPatcher = (_key, schema) => {
	const props = getProps(schema);
	const isTextOnlyBranch = !!props && 'appId' in props && 'appName' in props && 'text' in props && !('key' in props);
	if (!isTextOnlyBranch) {
		return false;
	}
	return rejectUnknownProps(schema);
};

const schemaPatchers: SchemaPatcher[] = [patchMessageAttachmentDefault, patchPlainFileAttachmentBranch, patchCallPreventionTextBranch];

const components = schemas.components?.schemas;

for (const key in components) {
	if (!Object.prototype.hasOwnProperty.call(components, key)) {
		continue;
	}

	const schema = components[key] as SchemaObject;

	for (const patch of schemaPatchers) {
		if (patch(key, schema)) {
			break;
		}
	}

	const uri = `#/components/schemas/${key}`;
	ajv.addSchema(components[key], uri);
	ajvQuery.addSchema(components[key], uri);
}
