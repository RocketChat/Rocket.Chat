import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type RoomsAutocompleteChannelAndPrivateWithPaginationParamsGET = {
	selector: string;
	offset: number;
	count: number;
	sort: Record<string, 1 | -1>;
};

const RoomsAutocompleteChannelAndPrivateWithPaginationParamsGETSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
		sort: {
			type: 'object',
			additionalProperties: {
				type: 'number',
			},
			required: [],
		},
	},
	additionalProperties: false,
	required: ['offset', 'count', 'sort', 'selector'],
};

export const isRoomsAutocompleteChannelAndPrivateWithPaginationParamsGET =
	ajv.compile<RoomsAutocompleteChannelAndPrivateWithPaginationParamsGET>(RoomsAutocompleteChannelAndPrivateWithPaginationParamsGETSchema);
