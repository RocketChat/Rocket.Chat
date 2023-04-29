import { ajv } from '../../helpers/schemas';

export type GetImportProgressParamsGET = Record<string, unknown>;

const GetImportProgressParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetImportProgressParamsGET = ajv.compile<GetImportProgressParamsGET>(GetImportProgressParamsGETSchema);
