import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

/** How many users a single add action may ring, which is also the cap on the action itself. */
export const VIDEO_CONF_ADD_PARTICIPANTS_LIMIT = 10;

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
			// Adding is capped so the whole batch can always be rung — see the ringing rules in the
			// video-conference persistent chat docs.
			maxItems: VIDEO_CONF_ADD_PARTICIPANTS_LIMIT,
		},
	},
	required: ['callId', 'users'],
	additionalProperties: false,
};

export const isVideoConfAddParticipantsProps = ajv.compile(videoConfAddParticipantsPropsSchema);
