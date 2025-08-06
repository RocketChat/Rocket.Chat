import { ajv } from './../Ajv';
export type GetImportFileDataParamsGET = Record<string, unknown>;

const GetImportFileDataParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetImportFileDataParamsGET = ajv.compile<GetImportFileDataParamsGET>(GetImportFileDataParamsGETSchema);
