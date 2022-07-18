import { ajv } from '../../Ajv';

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
