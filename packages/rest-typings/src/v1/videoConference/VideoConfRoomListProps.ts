import type { JSONSchemaType } from 'ajv';

import { ajvQuery } from '../Ajv';

export type VideoConfRoomListProps = {
	roomId: string;
};

const videoConfRoomListPropsSchema: JSONSchemaType<VideoConfRoomListProps> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isVideoConfRoomListProps = ajvQuery.compile(videoConfRoomListPropsSchema);
