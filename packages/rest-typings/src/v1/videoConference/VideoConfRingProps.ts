import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfRingProps = {
	callId: string;
	/**
	 * The member to ring, by user id — they are already a member, and members are tracked by id.
	 *
	 * One at a time: ringing a batch is what `add-participants` does, and it speaks usernames instead.
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
