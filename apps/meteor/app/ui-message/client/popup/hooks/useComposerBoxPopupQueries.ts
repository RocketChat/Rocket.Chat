import type { QueriesResults } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { ComposerBoxPopupOptions } from './useComposerBoxPopup';

export const useComposerBoxPopupQueries = <T extends { _id: string; sort?: number }>(
	filter: string,
	popup?: ComposerBoxPopupOptions<T>,
) => {
	const [counter, setCounter] = useState(0);

	useEffect(() => {
		setCounter(0);
	}, [popup, filter]);

	return useQueries({
		queries: [
			popup?.getItemsFromLocal && {
				keepPreviousData: true,
				queryKey: ['message-popup', 'local', filter, popup],
				queryFn: () => popup.getItemsFromLocal(filter),
				onSuccess: (args: T[]) => {
					if (args.length < 5) {
						setCounter(1);
					}
				},
			},
			popup?.getItemsFromServer && {
				keepPreviousData: true,
				queryKey: ['message-popup', 'server', filter, popup],
				queryFn: () => popup.getItemsFromServer(filter),
				enabled: counter > 0,
			},
		].filter(Boolean) as any,
	}) as QueriesResults<T[]>;
};
