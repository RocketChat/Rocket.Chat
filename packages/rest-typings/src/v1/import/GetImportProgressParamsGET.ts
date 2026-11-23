import { ajvQuery } from '../Ajv.js';

export type GetImportProgressParamsGET = Record<string, unknown>;

const GetImportProgressParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetImportProgressParamsGET = ajvQuery.compile<GetImportProgressParamsGET>(GetImportProgressParamsGETSchema);
