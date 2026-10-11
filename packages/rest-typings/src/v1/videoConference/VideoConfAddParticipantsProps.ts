import { RING_RECIPIENTS_LIMIT } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfAddParticipantsProps = {
	callId: string;
	/**
	 * The *usernames* of the people to add — not user ids. Adding someone can end with them invited into the
	 * room the chat lives in, and that machinery speaks usernames; `video-conference.ring` speaks ids instead,
	 * because it targets people who are already conference members. The endpoint answers with the user *ids*
	 * of the members it actually added.
	 */
	users: string[];
	/**
	 * Whether to ring the people being added. **Defaults to `false`** — adding someone is often so they can
	 * join when they can, and a ring nobody asked for is an interruption. Ringing also needs the
	 * `videoconf-ring-users` permission, without which it is skipped silently.
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
			description: 'Usernames of the people to add — not user ids. The endpoint returns the user ids of the members actually added.',
			items: {
				type: 'string',
			},
			minItems: 1,
			// Adding is capped so the whole batch can always be rung, which is why it is the ringing limit itself.
			maxItems: RING_RECIPIENTS_LIMIT,
		},
		ring: {
			type: 'boolean',
			description: 'Whether to ring the people being added. Defaults to false.',
			nullable: true,
		},
	},
	required: ['callId', 'users'],
	additionalProperties: false,
};

export const isVideoConfAddParticipantsProps = ajv.compile(videoConfAddParticipantsPropsSchema);
