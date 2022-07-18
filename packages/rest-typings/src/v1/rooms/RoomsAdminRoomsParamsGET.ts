import { ajv } from '../../Ajv';

export type GETAdminRooms = {
	offset: number;
	count: number;

	sort: Record<string, 1 | -1>;
	types: string;
	filter: string;
};

const GETAdminRoomsSchema = {
	type: 'object',
	properties: {
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
		types: {
			type: 'string',
		},
		filter: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['offset', 'count', 'sort', 'types', 'filter'],
};

export const isGETAdminRooms = ajv.compile<GETAdminRooms>(GETAdminRoomsSchema);
