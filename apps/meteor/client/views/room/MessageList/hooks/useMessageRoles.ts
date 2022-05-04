import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { RoomRoles, UserRoles, Roles } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

export const useMessageRoles = (userId: IUser['_id'] | undefined, roomId: IRoom['_id'], shouldLoadRoles: boolean): Array<string> =>
	useReactiveValue(
		useCallback(() => {
			if (!shouldLoadRoles || !userId) {
				return [];
			}

			const userRoles = UserRoles.findOne(userId);
			const roomRoles = RoomRoles.findOne({
				'u._id': userId,
				'rid': roomId,
			});

			const roles = [...(userRoles?.roles || []), ...(roomRoles?.roles || [])];

			const result = Roles.find(
				{
					_id: {
						$in: roles,
					},
					description: {
						$exists: 1,
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
		}, [userId, roomId, shouldLoadRoles]),
	);
