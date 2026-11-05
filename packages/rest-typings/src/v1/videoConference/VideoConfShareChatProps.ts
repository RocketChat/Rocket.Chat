import type { VideoConferenceChatAccessMode } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfShareChatProps = {
	callId: string;
	/**
	 * How to give the members without access to the chat: bring them into the room, or move the chat to a
	 * discussion. Required — which of the two leads is a choice the caller makes and shows, so the endpoint
	 * does not guess. `invite` is rejected for rooms that can't take new members.
	 */
	mode: VideoConferenceChatAccessMode;
	/**
	 * Who to share the chat with. Left out, the members of the call who cannot read it are worked out — which
	 * is what the notice in the call window asks for. Given, these are people being brought into the
	 * conversation instead, and whether anyone was already locked out makes no difference.
	 */
	users?: string[];
};

const videoConfShareChatPropsSchema: JSONSchemaType<VideoConfShareChatProps> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
		mode: {
			type: 'string',
			enum: ['invite', 'discussion'],
		},
		users: {
			type: 'array',
			items: { type: 'string' },
			nullable: true,
		},
	},
	required: ['callId', 'mode'],
	additionalProperties: false,
};

export const isVideoConfShareChatProps = ajv.compile(videoConfShareChatPropsSchema);
