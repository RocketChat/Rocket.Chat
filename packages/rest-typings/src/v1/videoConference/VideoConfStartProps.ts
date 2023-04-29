import { ajv } from '../../helpers/schemas';

export type VideoConfStartProps = { roomId: string; title?: string; allowRinging?: boolean };

const videoConfStartPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			nullable: false,
		},
		title: {
			type: 'string',
			nullable: true,
		},
		allowRinging: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isVideoConfStartProps = ajv.compile<VideoConfStartProps>(videoConfStartPropsSchema);
