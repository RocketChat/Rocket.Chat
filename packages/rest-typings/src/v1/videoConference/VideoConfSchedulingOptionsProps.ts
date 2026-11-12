import type { JSONSchemaType } from 'ajv';

import { ajvQuery } from '../Ajv';

export type VideoConfSchedulingOptionsProps = {
	/** Of the person booking; any of a user's addresses will do, in any case. */
	email: string;
};

const videoConfSchedulingOptionsPropsSchema: JSONSchemaType<VideoConfSchedulingOptionsProps> = {
	type: 'object',
	properties: {
		email: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['email'],
	additionalProperties: false,
};

export const isVideoConfSchedulingOptionsProps = ajvQuery.compile(videoConfSchedulingOptionsPropsSchema);
