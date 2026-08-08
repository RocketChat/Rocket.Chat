import type { IUser, IRole, IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
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

					// Updates must not mutate the cached records in place: react-query's
					// structural sharing would see the (mutated) old data as deep-equal
					// to the new one, keep the old reference and never notify observers.
					queryClient.setQueryData(roomsQueryKeys.roles(rid), (data: RoomRoles[] | undefined = []): RoomRoles[] => {
						const index = data?.findIndex((record) => record.rid === rid && record.u._id === u._id) ?? -1;

						if (index < 0) {
							return [...data, { rid, u, roles: [roleId] }];
						}

						return data.map((record, i) => (i === index ? { ...record, roles: [...new Set([...record.roles, roleId])] } : record));
					});
					break;
				}

				case 'removed': {
					const { _id: roleId, scope, u } = role;
					if (!scope || !u) return;

					queryClient.setQueryData(roomsQueryKeys.roles(rid), (data: RoomRoles[] | undefined = []) => {
						const index = data?.findIndex((record) => record.rid === rid && record.u._id === u._id) ?? -1;

						if (index < 0) return data;

						return data.map((record, i) => (i === index ? { ...record, roles: record.roles.filter((r) => r !== roleId) } : record));
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

				return data.map((record, i) => (i === index ? { ...record, u: { ...record.u, username, name } } : record));
			});
		});
	}, [enabled, queryClient, rid, subscribeToNotifyLogged]);

	const getRoomRoles = useEndpoint('GET', '/v1/rooms.roles');

	return useQuery({
		queryKey: roomsQueryKeys.roles(rid),
		queryFn: async () => {
			const { roles } = await getRoomRoles({
				rid,
			});

			return roles.map(
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
