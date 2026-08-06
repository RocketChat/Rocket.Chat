import { VIDEO_CONF_RINGING_LIMIT } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfAddParticipantsProps = {
	callId: string;
	users: string[];
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
	},
	required: ['callId', 'users'],
	additionalProperties: false,
};

export const isVideoConfAddParticipantsProps = ajv.compile(videoConfAddParticipantsPropsSchema);
