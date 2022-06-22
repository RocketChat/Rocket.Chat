import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GetCurrentImportOperationParamsGET = {
	userId: string;
	operation: string;
};

const GetCurrentImportOperationParamsGETSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
		operation: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['userId', 'operation'],
};

export const isGetCurrentImportOperationParamsGET = ajv.compile<GetCurrentImportOperationParamsGET>(
	GetCurrentImportOperationParamsGETSchema,
);
