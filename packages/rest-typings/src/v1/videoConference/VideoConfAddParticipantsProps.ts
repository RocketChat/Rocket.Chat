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
		},
	},
	required: ['callId', 'users'],
	additionalProperties: false,
};

export const isVideoConfAddParticipantsProps = ajv.compile(videoConfAddParticipantsPropsSchema);
