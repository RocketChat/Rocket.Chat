import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { RoomRoles, Roles } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { useUserRolesStore } from '../../../../hooks/useUserRolesStore';

export const useMessageRoles = (userId: IUser['_id'] | undefined, roomId: IRoom['_id'], shouldLoadRoles: boolean): Array<string> => {
	const userRoles = useUserRolesStore((state) => (userId ? state.rolesByUser.get(userId) : undefined));

	return useReactiveValue(
		useCallback(() => {
			if (!shouldLoadRoles || !userId) {
				return [];
			}

			const roomRoles = RoomRoles.findOne({
				'u._id': userId,
				'rid': roomId,
			});

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
		}, [userId, roomId, shouldLoadRoles, userRoles]),
	);
};
