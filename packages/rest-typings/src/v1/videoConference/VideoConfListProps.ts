import type { JSONSchemaType } from 'ajv';

import { ajvQuery } from '../Ajv.js';
import { paginationQueryProperties } from '../pagination.js';

export type VideoConfListProps = {
	roomId: string;
	count?: number;
	offset?: number;
};

const videoConfListPropsSchema: JSONSchemaType<VideoConfListProps> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			nullable: false,
		},
		...paginationQueryProperties,
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isVideoConfListProps = ajvQuery.compile(videoConfListPropsSchema);
