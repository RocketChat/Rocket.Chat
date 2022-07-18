import { ajv } from '../../Ajv';

export type GETAutocompleteChannelAndPrivateWithPagination = {
	selector: string;
	offset: number;
	count: number;
	sort: Record<string, 1 | -1>;
};

const GETAutocompleteChannelAndPrivateWithPaginationSchema = {
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

export const isGETAutocompleteChannelAndPrivateWithPagination = ajv.compile<GETAutocompleteChannelAndPrivateWithPagination>(
	GETAutocompleteChannelAndPrivateWithPaginationSchema,
);
