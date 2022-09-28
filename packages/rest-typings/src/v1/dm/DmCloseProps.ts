import { ajv } from '../../ajv';

export type DmCloseProps = {
	roomId: string;
};

const DmClosePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isDmCloseProps = ajv.compile<DmCloseProps>(DmClosePropsSchema);
