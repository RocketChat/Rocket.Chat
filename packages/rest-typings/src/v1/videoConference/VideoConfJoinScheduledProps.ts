import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfJoinScheduledProps = {
	sipAlias: string;
};

const videoConfJoinScheduledPropsSchema: JSONSchemaType<VideoConfJoinScheduledProps> = {
	type: 'object',
	properties: {
		sipAlias: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['sipAlias'],
	additionalProperties: false,
};

export const isVideoConfJoinScheduledProps = ajv.compile(videoConfJoinScheduledPropsSchema);
