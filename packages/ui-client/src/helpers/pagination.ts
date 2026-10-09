export type PageInfo = {
	offset: number;
	count: number;
	total: number;
};

export const getNextPageOffset = ({ offset, count, total }: PageInfo): number | undefined => {
	if (count <= 0 || offset + count >= total) {
		return undefined;
	}

	return offset + count;
};

export const getPageSize = (pageSize: number, page: PageInfo): number => {
	if (getNextPageOffset(page) === undefined || page.count >= pageSize) {
		return pageSize;
	}

	return page.count;
};
