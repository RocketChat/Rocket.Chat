import { ajvQuery } from '../Ajv';

export type ImportersListParamsGET = Record<string, unknown>;

const ImportersListParamsGETSchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
	required: [],
};

export const isImportersListParamsGET = ajvQuery.compile<ImportersListParamsGET>(ImportersListParamsGETSchema);
