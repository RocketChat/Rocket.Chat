import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type VideoConfInfoProps = { callId: string };

const videoConfInfoPropsSchema: JSONSchemaType<VideoConfInfoProps> = {
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

export const isVideoConfInfoProps = ajv.compile(videoConfInfoPropsSchema);
