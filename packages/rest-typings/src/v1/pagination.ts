/**
 * Query params of an offset-paginated request.
 *
 * The descriptions are the point: they reach the generated OpenAPI docs, which is the only place a
 * consumer can learn that the server does not have to honour the `count` it was given.
 */
export const paginationQueryProperties = {
	count: {
		type: 'integer',
		minimum: 0,
		nullable: true,
		description:
			'How many items to return. Each workspace sets a maximum page size and lowers any larger value to it, ' +
			'so a response can hold fewer items than asked for. When omitted, the workspace default page size is used. ' +
			'Zero returns every item if the workspace allows it, and the default page size otherwise.',
	},
	offset: {
		type: 'integer',
		minimum: 0,
		nullable: true,
		description: 'How many items to skip before this page.',
	},
} as const;

/** Envelope every offset-paginated response carries, alongside its own payload. */
export const paginatedResponseProperties = {
	count: {
		type: 'integer',
		minimum: 0,
		description: 'How many items this response carries. Not how many were asked for, and not how many exist.',
	},
	offset: {
		type: 'integer',
		minimum: 0,
		description: 'How many items were skipped before this page.',
	},
	total: {
		type: 'integer',
		minimum: 0,
		description: 'How many items match the query, across every page.',
	},
} as const;
