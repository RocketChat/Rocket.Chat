import { useMemo } from 'react';

type SortDirectionType = 'desc' | 'asc';

type SortDirectionReturnType = 1 | -1;

type SortFieldType = [string, SortDirectionType][];

type UseQueryReturnType = {
	offset?: number | undefined;
	count?: number | undefined;
	fields: string;
	query: string;
	sort: string;
};

type Params = {
	text: string;
	current: number;
	itemsPerPage: number;
};

const sortDir = (sortDir: SortDirectionType): SortDirectionReturnType =>
	sortDir === 'asc' ? 1 : -1;

const useQuery = (
	{ text, itemsPerPage, current }: Params,
	sortFields: SortFieldType,
): UseQueryReturnType =>
	useMemo(
		() => ({
			fields: JSON.stringify({
				name: 1,
				username: 1,
				emails: 1,
				roles: 1,
				status: 1,
				avatarETag: 1,
				active: 1,
			}),
			query: JSON.stringify({
				$or: [
					{ 'emails.address': { $regex: text || '', $options: 'i' } },
					{ username: { $regex: text || '', $options: 'i' } },
					{ name: { $regex: text || '', $options: 'i' } },
				],
			}),
			sort: JSON.stringify(
				sortFields.reduce((agg: Record<string, SortDirectionReturnType>, [column, direction]) => {
					agg[column] = sortDir(direction);
					return agg;
				}, {}),
			),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[text, itemsPerPage, current, sortFields],
	);

export default useQuery;
