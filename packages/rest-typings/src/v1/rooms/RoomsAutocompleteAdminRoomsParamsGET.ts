import { ajv } from '../../Ajv';

export type GETAutocompleteAdminRooms = {
	selector: string;
};

const GETAutocompleteAdminRoomsSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['selector'],
};

export const isGETAutocompleteAdminRooms = ajv.compile<GETAutocompleteAdminRooms>(GETAutocompleteAdminRoomsSchema);
