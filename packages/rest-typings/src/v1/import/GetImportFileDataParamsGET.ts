import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GetImportFileDataParamsGET = {
	userId: string;
};

const GetImportFileDataParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetImportFileDataParamsGET = ajv.compile<GetImportFileDataParamsGET>(GetImportFileDataParamsGETSchema);
