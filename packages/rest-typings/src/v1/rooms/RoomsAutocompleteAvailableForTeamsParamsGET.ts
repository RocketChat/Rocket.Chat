import { ajv } from '../../Ajv';

export type GETAutocompleteAvailableForTeams = {
	name: string;
};

const GETAutocompleteAvailableForTeamsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['name'],
};

export const isGETAutocompleteAvailableForTeams = ajv.compile<GETAutocompleteAvailableForTeams>(GETAutocompleteAvailableForTeamsSchema);
