import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

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
		offset: { type: 'number', nullable: true },
		count: { type: 'number', nullable: true },
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isVideoConfListProps = ajv.compile(videoConfListPropsSchema);
