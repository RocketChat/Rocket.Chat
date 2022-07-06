import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type RoomsGetDiscussionsParamsGET = {
	offset: number;
	count: number;

	sort?: string;
	fields?: string;
	query?: string;
};

const RoomsGetDiscussionsParamsGETSchema = {
	type: 'object',
	properties: {
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		fields: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['offset', 'count'],
};

export const isRoomsGetDiscussionsParamsGET = ajv.compile<RoomsGetDiscussionsParamsGET>(RoomsGetDiscussionsParamsGETSchema);
