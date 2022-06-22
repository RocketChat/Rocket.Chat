import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GetImportProgressParamsGET = {
	userId: string;
};

const GetImportProgressParamsGETSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['userId'],
};

export const isGetImportProgressParamsGET = ajv.compile<GetImportProgressParamsGET>(GetImportProgressParamsGETSchema);
