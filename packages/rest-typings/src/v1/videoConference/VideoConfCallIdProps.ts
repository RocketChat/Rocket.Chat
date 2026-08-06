import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

/**
 * The body of every conference endpoint that only has to say *which* call: cancel, decline, leave.
 *
 * They had a validator each, character for character the same, which is three places to keep in step for one
 * shape. What each endpoint then *does* with the call is where they actually differ.
 */
export type VideoConfCallIdProps = {
	callId: string;
};

const videoConfCallIdPropsSchema: JSONSchemaType<VideoConfCallIdProps> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['callId'],
	additionalProperties: false,
};

export const isVideoConfCallIdProps = ajv.compile(videoConfCallIdPropsSchema);

/** The name this shape shipped under before it was shared. Kept because it is part of the published surface. */
export type VideoConfCancelProps = VideoConfCallIdProps;
export const isVideoConfCancelProps = isVideoConfCallIdProps;
