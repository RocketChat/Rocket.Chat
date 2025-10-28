import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type VideoConfJoinProps = {
	callId: string;
	state?: {
		mic?: boolean;
		cam?: boolean;
	};
};

const videoConfJoinPropsSchema: JSONSchemaType<VideoConfJoinProps> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
		state: {
			type: 'object',
			nullable: true,
			properties: {
				mic: {
					type: 'boolean',
					nullable: true,
				},
				cam: {
					type: 'boolean',
					nullable: true,
				},
			},
			additionalProperties: false,
		},
	},
	required: ['callId'],
	additionalProperties: false,
};

export const isVideoConfJoinProps = ajv.compile(videoConfJoinPropsSchema);
