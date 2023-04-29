import { ajv } from '../../helpers/schemas';

export type VideoConfCancelProps = {
	callId: string;
};

const videoConfCancelPropsSchema = {
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

export const isVideoConfCancelProps = ajv.compile<VideoConfCancelProps>(videoConfCancelPropsSchema);
