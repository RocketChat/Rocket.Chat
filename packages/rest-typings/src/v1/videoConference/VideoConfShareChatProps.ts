import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfShareChatProps = {
	callId: string;
};

const videoConfShareChatPropsSchema: JSONSchemaType<VideoConfShareChatProps> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['callId'],
	additionalProperties: false,
};

export const isVideoConfShareChatProps = ajv.compile(videoConfShareChatPropsSchema);
