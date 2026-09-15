import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfAddParticipantsProps = {
	callId: string;
	users: string[];
	// When true, add the users to the conference's existing room (keeping its history) instead of
	// spinning up a new discussion for them.
	keepHistory?: boolean;
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
		keepHistory: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['callId', 'users'],
	additionalProperties: false,
};

export const isVideoConfAddParticipantsProps = ajv.compile(videoConfAddParticipantsPropsSchema);
