import type { VideoConferenceChatAccessMode } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfShareChatProps = {
	callId: string;
	/** When omitted the room's own rules decide; `invite` is rejected for rooms that can't take new members. */
	mode?: VideoConferenceChatAccessMode;
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
			nullable: true,
		},
	},
	required: ['callId'],
	additionalProperties: false,
};

export const isVideoConfShareChatProps = ajv.compile(videoConfShareChatPropsSchema);
