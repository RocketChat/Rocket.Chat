export type PaginatedResult<T = {}> = {
	count: number;
	offset: number;
	total: number;
} & T;
