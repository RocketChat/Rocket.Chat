import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

export type ModalsProps = {
	modalId: string;
};

export const isModalsProps = ajv.compile<ModalsProps>({
	type: 'object',
	properties: {
		modalId: {
			type: 'string',
		},
	},
	required: ['modalId'],
	additionalProperties: false,
});
