import { ajv } from '../Ajv';

export type DmBlockUserProps = {
	roomId: string;
	block: boolean;
};

const DmBlockUserPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
		block: {
			type: 'boolean',
		},
	},
	required: ['roomId', 'block'],
	additionalProperties: false,
};

export const isDmBlockUserProps = ajv.compile<DmBlockUserProps>(DmBlockUserPropsSchema);
