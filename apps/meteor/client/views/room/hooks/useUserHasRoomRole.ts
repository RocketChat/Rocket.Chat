import type { IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import type { RoomRoles } from '../../../hooks/useRoomRolesQuery';
import { useRoomRolesQuery } from '../../../hooks/useRoomRolesQuery';

export const useUserHasRoomRole = (uid: IUser['_id'], rid: IRoom['_id'], role: IRole['name']): boolean =>
	useRoomRolesQuery(rid, {
		select: useCallback(
			(records: RoomRoles[]) => records.some((record) => record.u._id === uid && record.roles.includes(role)),
			[role, uid],
		),
	}).data ?? false;
