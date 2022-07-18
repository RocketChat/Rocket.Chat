import { ajv } from '../../Ajv';

export type GETGetDiscussions = {
	offset: number;
	count: number;

	sort?: string;
	fields?: string;
	query?: string;
};

const GETGetDiscussionsSchema = {
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

export const isGETGetDiscussions = ajv.compile<GETGetDiscussions>(GETGetDiscussionsSchema);
