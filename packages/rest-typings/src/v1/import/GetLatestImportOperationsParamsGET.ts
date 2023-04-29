import { ajv } from '../../helpers/schemas';

export type GetLatestImportOperationsParamsGET = Record<string, unknown>;

const GetLatestImportOperationsParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetLatestImportOperationsParamsGET = ajv.compile<GetLatestImportOperationsParamsGET>(
	GetLatestImportOperationsParamsGETSchema,
);
