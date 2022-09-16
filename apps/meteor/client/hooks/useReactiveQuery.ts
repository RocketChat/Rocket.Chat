import { IRole, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { useQuery, UseQueryOptions, QueryKey, UseQueryResult, useQueryClient, QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { Roles, Rooms, Subscriptions, Users } from '../../app/models/client';

// For convenience as we want to minimize references to the old client models
const queryableCollections = {
	users: Users as Mongo.Collection<IUser>,
	rooms: Rooms as Mongo.Collection<IRoom>,
	subscriptions: Subscriptions as Mongo.Collection<ISubscription>,
	roles: Roles as Mongo.Collection<IRole>,
} as const;

const dep = new Tracker.Dependency();
const reactiveSources = new Set<{
	reactiveQueryFn: (collections: typeof queryableCollections) => unknown | undefined;
	queryClient: QueryClient;
	queryKey: QueryKey;
}>();

export const runReactiveFunctions = (): void => {
	if (!Tracker.currentComputation) {
		throw new Error('runReactiveFunctions must be called inside a Tracker.autorun');
	}

	dep.depend();

	for (const { reactiveQueryFn, queryClient, queryKey } of reactiveSources) {
		// This tracker will be invalidated when the query data changes
		Tracker.autorun((c) => {
			const data = reactiveQueryFn(queryableCollections);
			if (!c.firstRun) queryClient.setQueryData(queryKey, data);
		});
	}
};

// While React Query handles all async stuff, we need to handle the reactive stuff ourselves using effects
export const useReactiveQuery = <TQueryFnData, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
	queryKey: TQueryKey,
	reactiveQueryFn: (collections: typeof queryableCollections) => TQueryFnData | undefined,
	options?: UseQueryOptions<TQueryFnData, Error, TData, TQueryKey>,
): UseQueryResult<TData, Error> => {
	const queryClient = useQueryClient();

	useEffect(() => {
		const reactiveSource = { reactiveQueryFn, queryClient, queryKey };

		reactiveSources.add(reactiveSource);
		dep.changed();

		return (): void => {
			reactiveSources.delete(reactiveSource);
			dep.changed();
		};
	});

	return useQuery(
		queryKey,
		(): Promise<TQueryFnData> => {
			const result = Tracker.nonreactive(() => reactiveQueryFn(queryableCollections));

			if (result) return Promise.resolve(result);

			return new Promise(() => undefined);
		},
		{ staleTime: Infinity, ...options },
	);
};
