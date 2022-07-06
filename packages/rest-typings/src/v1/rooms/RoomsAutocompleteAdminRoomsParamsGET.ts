import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type RoomsAutocompleteAdminRoomsParamsGET = {
	selector: string;
};

const RoomsAutocompleteAdminRoomsParamsGETSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['selector'],
};

export const isRoomsAutocompleteAdminRoomsParamsGET = ajv.compile<RoomsAutocompleteAdminRoomsParamsGET>(
	RoomsAutocompleteAdminRoomsParamsGETSchema,
);
