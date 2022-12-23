import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GetImportFileDataParamsGET = Record<string, unknown>;

const GetImportFileDataParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetImportFileDataParamsGET = ajv.compile<GetImportFileDataParamsGET>(GetImportFileDataParamsGETSchema);
