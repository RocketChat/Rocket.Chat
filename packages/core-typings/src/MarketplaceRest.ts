export type PaginationMeta = {
	total: number;
	limit: number;
	offset: number;
	sort: string;
	filter: string;
};

export type Pagination = {
	offset: number;
	limit: number;
};

export interface IRestResponse<T> {
	data: T[];
	meta: PaginationMeta;
}
