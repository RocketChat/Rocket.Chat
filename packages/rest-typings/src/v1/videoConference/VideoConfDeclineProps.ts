import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfDeclineProps = {
	callId: string;
};

const videoConfDeclinePropsSchema: JSONSchemaType<VideoConfDeclineProps> = {
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

export const isVideoConfDeclineProps = ajv.compile(videoConfDeclinePropsSchema);
