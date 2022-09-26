import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

export type RoomsEraseProps = {
	rid: string;
};

const RoomsErasePropsSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
	},
	required: ['rid'],
	additionalProperties: false,
};

export const isRoomsEraseProps = ajv.compile<RoomsEraseProps>(RoomsErasePropsSchema);
