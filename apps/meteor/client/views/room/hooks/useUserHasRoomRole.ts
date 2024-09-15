import type { IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useQuery } from '@tanstack/react-query';
import { useMethod } from '@rocket.chat/ui-contexts';

export const useUserHasRoomRole = (uid: IUser['_id'], rid: IRoom['_id'], role: IRole['name']): boolean => {
	const getRoomRoles = useMethod('getRoomRoles');
	const { data } = useQuery({
		queryKey: ['roomRoles'],
		queryFn: async () => getRoomRoles(rid),
	});

	return useReactiveValue(
		useCallback(() => {
			if (!data) return false;
			return !!data.find((userRole) => {
				return userRole.rid === rid && userRole.u._id === uid && userRole.roles?.includes(role);
			});
		}, [uid, rid, role, data]),
	);
};
