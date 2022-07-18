import { ajv } from '../../Ajv';

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
