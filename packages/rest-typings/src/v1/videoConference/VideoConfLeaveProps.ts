import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfLeaveProps = {
	callId: string;
};

const videoConfLeavePropsSchema: JSONSchemaType<VideoConfLeaveProps> = {
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

export const isVideoConfLeaveProps = ajv.compile(videoConfLeavePropsSchema);
