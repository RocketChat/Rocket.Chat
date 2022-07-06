import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type RoomsAutocompleteAvailableForTeamsParamsGET = {
	name: string;
};

const RoomsAutocompleteAvailableForTeamsParamsGETSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['name'],
};

export const isRoomsAutocompleteAvailableForTeamsParamsGET = ajv.compile<RoomsAutocompleteAvailableForTeamsParamsGET>(
	RoomsAutocompleteAvailableForTeamsParamsGETSchema,
);
