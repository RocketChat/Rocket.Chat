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

export type RestResponse = {
	data: any;
	meta: PaginationMeta;
};
