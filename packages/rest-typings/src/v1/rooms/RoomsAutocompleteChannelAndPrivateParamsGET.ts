import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type RoomsAutocompleteChannelAndPrivateParamsGET = {
	selector: string;
};

const RoomsAutocompleteChannelAndPrivateParamsGETSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['selector'],
};

export const isRoomsAutocompleteChannelAndPrivateParamsGET = ajv.compile<RoomsAutocompleteChannelAndPrivateParamsGET>(
	RoomsAutocompleteChannelAndPrivateParamsGETSchema,
);
