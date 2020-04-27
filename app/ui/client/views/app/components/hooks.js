import { useMemo } from 'react';

export function useQuery(params, sort, type, workspace = 'local') {
	return useMemo(() => ({
		query: JSON.stringify({
			type,
			text: params.text,
			workspace,
		}),
		sort: JSON.stringify({ [sort[0]]: sort[1] === 'asc' ? 1 : 0 }),
		...params.itemsPerPage && { count: params.itemsPerPage },
		...params.current && { offset: params.current },
	}), [params.itemsPerPage, params.current, sort, type, workspace, params.text]);
}
