import type { IRole, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { UseQueryOptions, QueryKey, UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tracker } from 'meteor/tracker';

import { Roles, RoomRoles, Rooms, Subscriptions, Users } from '../../app/models/client';
import { queueMicrotask } from '../lib/utils/queueMicrotask';

// For convenience as we want to minimize references to the old client models
const queryableCollections = {
	users: Users as Mongo.Collection<IUser>,
	rooms: Rooms as Mongo.Collection<IRoom>,
	subscriptions: Subscriptions as Mongo.Collection<ISubscription>,
	roles: Roles as Mongo.Collection<IRole>,
	roomRoles: RoomRoles as Mongo.Collection<Pick<ISubscription, 'rid' | 'u' | 'roles'>>,
} as const;

export const useReactiveQuery = <TQueryFnData, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
	queryKey: TQueryKey,
	reactiveQueryFn: (collections: typeof queryableCollections) => TQueryFnData,
	options?: UseQueryOptions<TQueryFnData, Error, TData, TQueryKey>,
): UseQueryResult<TData, Error> => {
	const queryClient = useQueryClient();

	return useQuery(
		queryKey,
		(): Promise<TQueryFnData> =>
			new Promise((resolve, reject) => {
				queueMicrotask(() => {
					Tracker.autorun((c) => {
						const data = reactiveQueryFn(queryableCollections);

						if (c.firstRun) {
							if (data === undefined) {
								reject(new Error('Reactive query returned undefined'));
							} else {
								resolve(data);
							}
							return;
						}

						queryClient.refetchQueries(queryKey, { exact: true });
						c.stop();
					});
				});
			}),
		{ staleTime: Infinity, ...options },
	);
};
