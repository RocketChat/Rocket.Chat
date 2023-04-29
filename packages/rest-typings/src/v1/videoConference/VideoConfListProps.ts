import { ajv } from '../../helpers/schemas';

export type VideoConfListProps = {
	roomId: string;
	count?: number;
	offset?: number;
};

const videoConfListPropsSchema = {
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

export const isVideoConfListProps = ajv.compile<VideoConfListProps>(videoConfListPropsSchema);
