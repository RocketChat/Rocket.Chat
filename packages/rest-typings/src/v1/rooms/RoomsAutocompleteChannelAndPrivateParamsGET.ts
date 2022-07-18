import { ajv } from '../../Ajv';

export type GETAutocompleteChannelAndPrivate = {
	selector: string;
};

const GETAutocompleteChannelAndPrivateSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['selector'],
};

export const isGETAutocompleteChannelAndPrivate = ajv.compile<GETAutocompleteChannelAndPrivate>(GETAutocompleteChannelAndPrivateSchema);
