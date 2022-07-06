import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type RoomsAdminRoomsParamsGET = {
	offset: number;
	count: number;

	sort: Record<string, 1 | -1>;
	types: string;
	filter: string;
};

const RoomsAdminRoomsParamsGETSchema = {
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

export const isRoomsAdminRoomsParamsGET = ajv.compile<RoomsAdminRoomsParamsGET>(RoomsAdminRoomsParamsGETSchema);
