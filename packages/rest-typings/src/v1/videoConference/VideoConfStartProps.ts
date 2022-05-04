import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv();

export type VideoConfStartProps = { roomId: string };

const videoConfStartPropsSchema: JSONSchemaType<VideoConfStartProps> = {
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

export const isVideoConfStartProps = ajv.compile(videoConfStartPropsSchema);
