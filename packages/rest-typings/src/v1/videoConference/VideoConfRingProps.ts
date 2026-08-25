import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfRingProps = {
	callId: string;
	/** Ring only these members. Omitted, everyone who isn't in the call is rung. */
	users?: string[];
};

const videoConfRingPropsSchema: JSONSchemaType<VideoConfRingProps> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
		users: {
			type: 'array',
			items: { type: 'string' },
			minItems: 1,
			nullable: true,
		},
	},
	required: ['callId'],
	additionalProperties: false,
};

export const isVideoConfRingProps = ajv.compile(videoConfRingPropsSchema);
