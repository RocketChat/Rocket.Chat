/**
 * The offset-pagination contract, in one place.
 *
 * Spread these into a schema's `properties` rather than restating them. Restating them is how the
 * same three fields ended up declared with six different types across the API, and how
 * `commands.list` came to report the collection size in a field meaning the page size.
 *
 * Endpoints that page by cursor (federation's `pageToken`, `chat.history`'s `aroundId`) are a
 * different contract and do not belong here.
 *
 * Pairs with the `PaginatedRequest` / `PaginatedResult` TypeScript helpers.
 */

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
			'How many items to return. The workspace caps it: a page holds `min(count, API_Upper_Count_Limit)` ' +
			'items, so a response can be smaller than asked for — page by what the response carried, never by ' +
			'this number. Omitted, `API_Default_Count` applies. Zero means every item when ' +
			'`API_Allow_Infinite_Count` is enabled, and `API_Default_Count` otherwise.',
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
