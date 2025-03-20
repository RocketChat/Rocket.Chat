import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GetLatestImportOperationsParamsGET = Record<string, unknown>;

const GetLatestImportOperationsParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isGetLatestImportOperationsParamsGET = ajv.compile<GetLatestImportOperationsParamsGET>(
	GetLatestImportOperationsParamsGETSchema,
);
