import { ajvQuery } from '../Ajv';

export type GetImportFileDataParamsGET = Record<string, unknown>;

const GetImportFileDataParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetImportFileDataParamsGET = ajvQuery.compile<GetImportFileDataParamsGET>(GetImportFileDataParamsGETSchema);
