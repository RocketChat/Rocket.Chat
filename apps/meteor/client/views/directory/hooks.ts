import { useMemo } from 'react';

export function useQuery(
	{ text, itemsPerPage, current }: { text: string; current: number; itemsPerPage: number },
	[column, direction]: [string, 'asc' | 'desc'],
	type: string,
	workspace = 'local',
): { offset?: number | undefined; count?: number; query: string; sort: string } {
	return useMemo(
		() => ({
			query: JSON.stringify({
				type,
				text,
				workspace,
			}),
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[itemsPerPage, current, column, direction, type, workspace, text],
	);
}
