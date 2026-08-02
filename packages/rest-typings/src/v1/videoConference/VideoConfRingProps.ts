import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfRingProps = {
	callId: string;
};

const videoConfRingPropsSchema: JSONSchemaType<VideoConfRingProps> = {
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

export const isVideoConfRingProps = ajv.compile(videoConfRingPropsSchema);
