import { ajv } from '../../Ajv';

export type GetLatestImportOperationsParamsGET = {};

const GetLatestImportOperationsParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetLatestImportOperationsParamsGET = ajv.compile<GetLatestImportOperationsParamsGET>(
	GetLatestImportOperationsParamsGETSchema,
);
