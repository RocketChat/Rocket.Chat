export interface IPagination {
	offset: number;
	count: number;
	sort: Record<string, any>;
}

export interface IPaginatedResponse {
	count: number;
	offset: number;
	total: number;
}
