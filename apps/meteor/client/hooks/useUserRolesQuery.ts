import type { IRole, IUser } from '@rocket.chat/core-typings';
import { useMethod, useStream, useUserId } from '@rocket.chat/ui-contexts';
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

					queryClient.setQueryData(rolesQueryKeys.userRoles(), (data: UserRoles[] | undefined = []): UserRoles[] => {
						const index = data?.findIndex((record) => record.uid === u._id) ?? -1;

						if (index < 0) {
							return [...data, { uid: u._id, roles: [roleId] }];
						}

						const roles = new Set(data[index].roles);
						roles.add(roleId);
						data[index] = { ...data[index], roles: [...roles] };

						return [...data];
					});
					break;
				}

				case 'removed': {
					const { _id: roleId, scope, u } = role;
					if (!!scope || !u) return;

					queryClient.setQueryData(rolesQueryKeys.userRoles(), (data: UserRoles[] | undefined = []): UserRoles[] => {
						const index = data?.findIndex((record) => record.uid === u._id) ?? -1;

						if (index < 0) return data;

						const roles = new Set(data[index].roles);
						roles.delete(roleId);
						data[index] = { ...data[index], roles: [...roles] };

						return [...data];
					});
					break;
				}
			}
		});
	}, [enabled, queryClient, subscribeToNotifyLogged, uid]);

	const getUserRoles = useMethod('getUserRoles');

	return useQuery({
		queryKey: rolesQueryKeys.userRoles(),
		queryFn: async () => {
			const results = await getUserRoles();

			return results.map(
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
