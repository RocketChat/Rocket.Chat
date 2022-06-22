import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GetLatestImportOperationsParamsGET = {
	userId: string;
};

const GetLatestImportOperationsParamsGETSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['userId'],
};

export const isGetLatestImportOperationsParamsGET = ajv.compile<GetLatestImportOperationsParamsGET>(
	GetLatestImportOperationsParamsGETSchema,
);
