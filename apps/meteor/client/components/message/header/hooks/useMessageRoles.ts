import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { Roles } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { useRoomRolesStore } from '../../../../hooks/useRoomRolesStore';
import { useUserRolesStore } from '../../../../hooks/useUserRolesStore';

export const useMessageRoles = (userId: IUser['_id'] | undefined, roomId: IRoom['_id'], shouldLoadRoles: boolean): Array<string> => {
	const userRoles = useUserRolesStore((state) => (userId ? state.rolesByUser.get(userId) : undefined));
	const roomRoles = useRoomRolesStore((state) => state.records.find((record) => record.rid === roomId && record.u._id === userId));

	return useReactiveValue(
		useCallback(() => {
			if (!shouldLoadRoles || !userId) {
				return [];
			}

			const roles = [...(userRoles ?? []), ...(roomRoles?.roles || [])];

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
