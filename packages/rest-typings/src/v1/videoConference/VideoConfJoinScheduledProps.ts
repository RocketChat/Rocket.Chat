import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfJoinScheduledProps = {
	/**
	 * The number that was dialled. It may not stand for a conference yet — an alias can be handed out ahead of
	 * the call, and whoever asks first brings it into being.
	 */
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
