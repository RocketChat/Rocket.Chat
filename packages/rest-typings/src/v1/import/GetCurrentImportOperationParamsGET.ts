import { ajvQuery } from '../Ajv';

export type GetCurrentImportOperationParamsGET = Record<string, unknown>;

const GetCurrentImportOperationParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetCurrentImportOperationParamsGET = ajvQuery.compile<GetCurrentImportOperationParamsGET>(
	GetCurrentImportOperationParamsGETSchema,
);
