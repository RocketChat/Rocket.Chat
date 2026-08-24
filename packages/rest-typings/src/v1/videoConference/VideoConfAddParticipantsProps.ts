import { VIDEO_CONF_RINGING_LIMIT } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfAddParticipantsProps = {
	callId: string;
	users: string[];
	/**
	 * Whether to ring the people being added. Defaults to ringing: someone added to a call in progress is being
	 * called *now*, and the whole point of adding them is usually that they are wanted in it.
	 */
	ring?: boolean;
};

const videoConfAddParticipantsPropsSchema: JSONSchemaType<VideoConfAddParticipantsProps> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
		users: {
			type: 'array',
			items: {
				type: 'string',
			},
			minItems: 1,
			// Adding is capped so the whole batch can always be rung, which is why it is the ringing limit itself.
			maxItems: VIDEO_CONF_RINGING_LIMIT,
		},
		ring: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['callId', 'users'],
	additionalProperties: false,
};

export const isVideoConfAddParticipantsProps = ajv.compile(videoConfAddParticipantsPropsSchema);
