import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfRoomDeleteProps = {
	conferenceRoomId: string;
};

const videoConfRoomDeletePropsSchema: JSONSchemaType<VideoConfRoomDeleteProps> = {
	type: 'object',
	properties: {
		conferenceRoomId: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['conferenceRoomId'],
	additionalProperties: false,
};

export const isVideoConfRoomDeleteProps = ajv.compile(videoConfRoomDeletePropsSchema);
