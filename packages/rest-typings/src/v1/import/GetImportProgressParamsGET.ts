import { ajv } from '../../Ajv';

export type GetImportProgressParamsGET = {};

const GetImportProgressParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetImportProgressParamsGET = ajv.compile<GetImportProgressParamsGET>(GetImportProgressParamsGETSchema);
