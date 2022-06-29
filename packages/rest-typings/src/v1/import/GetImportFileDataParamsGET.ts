import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GetImportFileDataParamsGET = {
	userId: string;
};

const GetImportFileDataParamsGETSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['userId'],
};

export const isGetImportFileDataParamsGET = ajv.compile<GetImportFileDataParamsGET>(GetImportFileDataParamsGETSchema);
