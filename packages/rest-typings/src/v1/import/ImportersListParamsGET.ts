import { ajvQuery } from '../Ajv.js';

export type ImportersListParamsGET = Record<string, unknown>;

const ImportersListParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isImportersListParamsGET = ajvQuery.compile<ImportersListParamsGET>(ImportersListParamsGETSchema);
