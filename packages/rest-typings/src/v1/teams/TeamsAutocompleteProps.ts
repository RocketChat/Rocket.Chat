import Ajv from 'ajv';

const ajv = new Ajv();

export type TeamsAutocompleteProps = { name: string };

const teamsAutocompletePropsSchema = {
	type: 'object',
	properties: {
		name: { type: 'string' },
	},
	required: ['name'],
	additionalProperties: false,
};

export const isTeamsAutocompleteProps = ajv.compile<TeamsAutocompleteProps>(teamsAutocompletePropsSchema);
