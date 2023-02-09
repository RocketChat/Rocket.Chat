import type { QueriesResults } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export const useComposerBoxPopupQueries = <T extends { _id: string }>(
	filter: string,
	getItemsFromLocal?: (filter: string) => Promise<T[]>,
	getItemsFromServer?: (filter: string) => Promise<T[]>,
) => {
	const [counter, setCounter] = useState(0);

	useEffect(() => {
		setCounter(0);
	}, [filter]);

	return useQueries({
		queries: [
			getItemsFromLocal && {
				keepPreviousData: true,
				queryKey: ['message-popup', 'local', filter],
				queryFn: () => getItemsFromLocal(filter),
				onSuccess: (args: T[]) => {
					if (args.length < 5) {
						setCounter(1);
					}
				},
			},
			getItemsFromServer && {
				keepPreviousData: true,
				queryKey: ['message-popup', 'server', filter],
				queryFn: () => getItemsFromServer(filter),
				enabled: counter > 0,
			},
		].filter(Boolean) as any,
	}) as QueriesResults<T[]>;
};
