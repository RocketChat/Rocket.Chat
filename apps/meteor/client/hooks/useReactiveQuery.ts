import type { UseQueryOptions, QueryKey, UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tracker } from 'meteor/tracker';

import { queueMicrotask } from '../lib/utils/queueMicrotask';

export const useReactiveQuery = <TQueryFnData, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
	queryKey: TQueryKey,
	reactiveQueryFn: () => TQueryFnData,
	options?: UseQueryOptions<TQueryFnData, Error, TData, TQueryKey>,
): UseQueryResult<TData, Error> => {
	const queryClient = useQueryClient();

	return useQuery({
		queryKey,
		queryFn: (): Promise<TQueryFnData> =>
			new Promise((resolve, reject) => {
				queueMicrotask(() => {
					Tracker.autorun((c) => {
						const data = reactiveQueryFn();

						if (c.firstRun) {
							if (data === undefined) {
								reject(new Error('Reactive query returned undefined'));
							} else {
								resolve(data);
							}
							return;
						}

						queryClient.invalidateQueries({ queryKey, exact: true });
						c.stop();
					});
				});
			}),
		staleTime: Infinity,
		...options,
	});
};
