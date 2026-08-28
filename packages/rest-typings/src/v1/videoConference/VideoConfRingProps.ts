import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfRingProps = {
	callId: string;
	/**
	 * The member to ring, by user *id* — not username. Ringing targets someone who is already a conference
	 * member, and members are tracked by id; `video-conference.add-participants` speaks usernames instead,
	 * because it may also invite people into a room.
	 *
	 * One at a time on purpose: ringing again is aimed at a particular person who didn't pick up, so the caller
	 * says who. Ringing a batch is what adding participants does.
	 */
	userId: string;
};

const videoConfRingPropsSchema: JSONSchemaType<VideoConfRingProps> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
		userId: {
			type: 'string',
			description: 'Id of the member to ring — not their username.',
			nullable: false,
		},
	},
	required: ['callId', 'userId'],
	additionalProperties: false,
};

export const isVideoConfRingProps = ajv.compile(videoConfRingPropsSchema);
