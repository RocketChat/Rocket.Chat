import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfRoomCreateProps = {
	roomId: string;
	/** What to call the link. Trimmed; its address is derived from it. */
	title: string;
};

const videoConfRoomCreatePropsSchema: JSONSchemaType<VideoConfRoomCreateProps> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			nullable: false,
		},
		title: {
			type: 'string',
			nullable: false,
			minLength: 1,
			maxLength: 200,
		},
	},
	required: ['roomId', 'title'],
	additionalProperties: false,
};

export const isVideoConfRoomCreateProps = ajv.compile(videoConfRoomCreatePropsSchema);
