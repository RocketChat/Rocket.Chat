import type { IRole, IUser } from '@rocket.chat/core-typings';
import { useStream, useUserId, useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { rolesQueryKeys } from '../lib/queryKeys';

export type UserRoles = {
	uid: IUser['_id'];
	roles: IRole['_id'][];
};

type UseUserRolesQueryOptions<TData = UserRoles[]> = Omit<
	UseQueryOptions<UserRoles[], Error, TData, ReturnType<typeof rolesQueryKeys.userRoles>>,
	'queryKey' | 'queryFn'
>;

export const useUserRolesQuery = <TData = UserRoles[]>(options?: UseUserRolesQueryOptions<TData>) => {
	const queryClient = useQueryClient();

	const uid = useUserId();

	const subscribeToNotifyLogged = useStream('notify-logged');

	const enabled = !!uid && (options?.enabled ?? true);

	useEffect(() => {
		if (!enabled) return;

		return subscribeToNotifyLogged('roles-change', (role) => {
			switch (role.type) {
				case 'added': {
					const { _id: roleId, scope, u } = role;
					if (!!scope || !u) return;

					// Updates must not mutate the cached records in place: react-query's
					// structural sharing would see the (mutated) old data as deep-equal
					// to the new one, keep the old reference and never notify observers.
					queryClient.setQueryData(rolesQueryKeys.userRoles(), (data: UserRoles[] | undefined = []): UserRoles[] => {
						const index = data?.findIndex((record) => record.uid === u._id) ?? -1;

						if (index < 0) {
							return [...data, { uid: u._id, roles: [roleId] }];
						}

						return data.map((record, i) => (i === index ? { ...record, roles: [...new Set([...record.roles, roleId])] } : record));
					});
					break;
				}

				case 'removed': {
					const { _id: roleId, scope, u } = role;
					if (!!scope || !u) return;

					queryClient.setQueryData(rolesQueryKeys.userRoles(), (data: UserRoles[] | undefined = []): UserRoles[] => {
						const index = data?.findIndex((record) => record.uid === u._id) ?? -1;

						if (index < 0) return data;

						return data.map((record, i) => (i === index ? { ...record, roles: record.roles.filter((r) => r !== roleId) } : record));
					});
					break;
				}
			}
		});
	}, [enabled, queryClient, subscribeToNotifyLogged, uid]);

	const getUserRoles = useEndpoint('GET', '/v1/roles.getUsersInPublicRoles');

	return useQuery({
		queryKey: rolesQueryKeys.userRoles(),
		queryFn: async () => {
			const { users } = await getUserRoles();

			return users.map(
				(record): UserRoles => ({
					uid: record._id,
					roles: record.roles,
				}),
			);
		},
		staleTime: Infinity,
		...options,
		enabled,
	});
};
