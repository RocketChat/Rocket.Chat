import { useMemo } from 'react';

export function useQuery({ text, itemsPerPage, current }, [column, direction], type, workspace = 'local') {
	return useMemo(
		() => ({
			query: JSON.stringify({
				type,
				text,
				workspace,
			}),
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : 0 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[itemsPerPage, current, column, direction, type, workspace, text],
	);
}
