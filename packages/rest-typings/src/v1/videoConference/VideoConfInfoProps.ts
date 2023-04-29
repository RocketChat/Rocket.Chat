import { ajv } from '../../helpers/schemas';

export type VideoConfInfoProps = { callId: string };

const videoConfInfoPropsSchema = {
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

export const isVideoConfInfoProps = ajv.compile<VideoConfInfoProps>(videoConfInfoPropsSchema);
