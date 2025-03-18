import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { Roles } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import type { RoomRoles } from '../../../../hooks/useRoomRolesQuery';
import { useRoomRolesQuery } from '../../../../hooks/useRoomRolesQuery';
import type { UserRoles } from '../../../../hooks/useUserRolesQuery';
import { useUserRolesQuery } from '../../../../hooks/useUserRolesQuery';

export const useMessageRoles = (userId: IUser['_id'] | undefined, roomId: IRoom['_id'], shouldLoadRoles: boolean): Array<string> => {
	const { data: userRoles } = useUserRolesQuery({
		select: useCallback((records: UserRoles[]) => records.find((record) => record.uid === userId)?.roles ?? [], [userId]),
		enabled: shouldLoadRoles && !!userId,
	});

	const { data: roomRoles } = useRoomRolesQuery(roomId, {
		select: useCallback((records: RoomRoles[]) => records.find((record) => record.u._id === userId)?.roles ?? [], [userId]),
		enabled: shouldLoadRoles && !!userId,
	});

	return useReactiveValue(
		useCallback(() => {
			if (!shouldLoadRoles || !userId) {
				return [];
			}

			const roles = [...(userRoles ?? []), ...(roomRoles ?? [])];

			const result = Roles.find(
				{
					_id: {
						$in: roles,
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
			).fetch();
			return result.map(({ description }) => description);
		}, [userId, shouldLoadRoles, userRoles, roomRoles]),
	);
};
