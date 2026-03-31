import { ajv } from '../Ajv';

export type ImportersListParamsGET = Record<string, unknown>;

const ImportersListParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isImportersListParamsGET = ajv.compile<ImportersListParamsGET>(ImportersListParamsGETSchema);
