import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { UseQueryResult } from '@tanstack/react-query';

import { useReactiveQuery } from '../../../../hooks/useReactiveQuery';

export const useMessageRoles = (
	uid: IUser['_id'] | undefined,
	rid: IRoom['_id'],
	shouldLoadRoles: boolean,
): UseQueryResult<string[], Error> => {
	const userRolesQueryResult = useReactiveQuery(['users', uid, 'roles'], ({ userRoles }) => userRoles.findOne(uid), {
		enabled: shouldLoadRoles && !!uid,
	});

	const roomRolesQueryResult = useReactiveQuery(
		['rooms', rid, 'user', uid, 'roles'],
		({ roomRoles }) =>
			roomRoles.findOne({
				'u._id': uid,
				rid,
			}),
		{
			enabled: shouldLoadRoles && !!uid,
		},
	);

	return useReactiveQuery(
		['rooms', rid, 'messages', 'roles', uid],
		({ roles }) =>
			roles
				.find(
					{
						_id: {
							$in: [...(userRolesQueryResult.data?.roles ?? []), ...(roomRolesQueryResult.data?.roles ?? [])],
						},
						description: {
							$exists: true,
							$ne: '',
						},
					},
					{
						fields: {
							description: 1,
						},
					},
				)
				.map(({ description }) => description),
		{
			enabled: userRolesQueryResult.isSuccess && roomRolesQueryResult.isSuccess,
		},
	);
};
