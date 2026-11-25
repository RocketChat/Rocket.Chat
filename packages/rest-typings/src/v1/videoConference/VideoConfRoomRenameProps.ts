import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfRoomRenameProps = {
	conferenceRoomId: string;
	/** What to call the link. Trimmed; its address is derived from it. */
	title: string;
};

const videoConfRoomRenamePropsSchema: JSONSchemaType<VideoConfRoomRenameProps> = {
	type: 'object',
	properties: {
		conferenceRoomId: {
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
	required: ['conferenceRoomId', 'title'],
	additionalProperties: false,
};

export const isVideoConfRoomRenameProps = ajv.compile(videoConfRoomRenamePropsSchema);
