import type { IUser, IRole, IRoom } from '@rocket.chat/core-typings';
import { useMethod, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useEffect } from 'react';

import { roomsQueryKeys } from '../lib/queryKeys';

export type RoomRoles = {
	rid: IRoom['_id'];
	u: Pick<IUser, '_id' | 'name' | 'username'>;
	roles: IRole['_id'][];
};

type UseRoomRolesQueryOptions<TData = RoomRoles[]> = Omit<
	UseQueryOptions<RoomRoles[], Error, TData, ReturnType<typeof roomsQueryKeys.roles>>,
	'queryKey' | 'queryFn'
>;

export const useRoomRolesQuery = <TData = RoomRoles[]>(rid: IRoom['_id'], options?: UseRoomRolesQueryOptions<TData>) => {
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
					if (!scope || !u) return;

					queryClient.setQueryData(roomsQueryKeys.roles(rid), (data: RoomRoles[] | undefined = []): RoomRoles[] => {
						const index = data?.findIndex((record) => record.rid === rid && record.u._id === u._id) ?? -1;

						if (index < 0) {
							return [...data, { rid, u, roles: [roleId] }];
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

					queryClient.setQueryData(roomsQueryKeys.roles(rid), (data: RoomRoles[] | undefined = []) => {
						const index = data?.findIndex((record) => record.rid === rid && record.u._id === u._id) ?? -1;

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
	}, [enabled, queryClient, rid, subscribeToNotifyLogged, uid]);

	useEffect(() => {
		if (!enabled) return;

		return subscribeToNotifyLogged('Users:NameChanged', ({ _id: uid, username, name }: Partial<IUser>) => {
			if (!uid) {
				return;
			}

			queryClient.setQueryData(roomsQueryKeys.roles(rid), (data: RoomRoles[] | undefined = []) => {
				const index = data?.findIndex((record) => record.rid === rid && record.u._id === uid) ?? -1;

				if (index < 0) {
					return [...data, { rid, u: { _id: uid, username, name }, roles: [] }];
				}

				data[index] = {
					...data[index],
					u: {
						...data[index].u,
						username,
						name,
					},
				};

				return [...data];
			});
		});
	}, [enabled, queryClient, rid, subscribeToNotifyLogged]);

	const getRoomRoles = useMethod('getRoomRoles');

	return useQuery({
		queryKey: roomsQueryKeys.roles(rid),
		queryFn: async () => {
			const results = await getRoomRoles(rid);

			return results.map(
				(record): RoomRoles => ({
					rid: record.rid,
					u: record.u,
					roles: record.roles ?? [],
				}),
			);
		},
		staleTime: Infinity,
		...options,
		enabled,
	});
};
