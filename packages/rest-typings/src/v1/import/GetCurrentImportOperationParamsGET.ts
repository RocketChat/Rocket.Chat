import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GetCurrentImportOperationParamsGET = {};

const GetCurrentImportOperationParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetCurrentImportOperationParamsGET = ajv.compile<GetCurrentImportOperationParamsGET>(
	GetCurrentImportOperationParamsGETSchema,
);
