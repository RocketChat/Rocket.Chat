import { ajv } from '../../Ajv';

type DmKickProps = {
	roomId: string;
	userId: string;
};

const DmKickPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		userId: {
			type: 'string',
		},
	},
	required: ['roomId', 'userId'],
	additionalProperties: false,
};

export const isDmKickProps = ajv.compile<DmKickProps>(DmKickPropsSchema);
