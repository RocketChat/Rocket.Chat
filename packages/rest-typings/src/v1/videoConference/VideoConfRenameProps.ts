import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfRenameProps = {
	callId: string;
	/** What to call the conference. Trimmed, and only the person who started it may set it. */
	title: string;
};

const videoConfRenamePropsSchema: JSONSchemaType<VideoConfRenameProps> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
		title: {
			type: 'string',
			nullable: false,
			minLength: 1,
			maxLength: 200,
		},
	},
	required: ['callId', 'title'],
	additionalProperties: false,
};

export const isVideoConfRenameProps = ajv.compile(videoConfRenamePropsSchema);
