import { VIDEO_CONF_RINGING_LIMIT } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfRingProps = {
	callId: string;
	/**
	 * Ring only these members, by user *id* — not username. Ringing targets people who are already conference
	 * members, and members are tracked by id; `video-conference.add-participants` speaks usernames instead,
	 * because it may also invite people into a room. Omitted, everyone who isn't in the call is rung. The
	 * endpoint answers with the user ids it actually rang.
	 */
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
			description: 'User ids of the members to ring — not usernames. The endpoint returns the user ids it actually rang.',
			items: { type: 'string' },
			minItems: 1,
			// A named list may never exceed what a ring is allowed to reach; asking for more is a malformed
			// request, not a set to be trimmed.
			maxItems: VIDEO_CONF_RINGING_LIMIT,
			nullable: true,
		},
	},
	required: ['callId'],
	additionalProperties: false,
};

export const isVideoConfRingProps = ajv.compile(videoConfRingPropsSchema);
