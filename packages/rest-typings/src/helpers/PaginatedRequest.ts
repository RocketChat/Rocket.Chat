export type PaginatedRequest<T = Record<string, boolean | number | string | object>, S extends string = string> = {
	count?: string;
	offset?: string;
	sort?: `{ "${S}": ${1 | -1} }` | string;
	/* deprecated */
	query?: string;
} & T;
