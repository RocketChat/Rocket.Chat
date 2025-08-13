import type { IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import { useCallback } from 'react';
import { useShallow } from 'zustand/shallow';

import type { RoomRoles } from '../../../../hooks/useRoomRolesQuery';
import { useRoomRolesQuery } from '../../../../hooks/useRoomRolesQuery';
import type { UserRoles } from '../../../../hooks/useUserRolesQuery';
import { useUserRolesQuery } from '../../../../hooks/useUserRolesQuery';
import { Roles } from '../../../../stores';

export const useMessageRoles = (userId: IUser['_id'] | undefined, roomId: IRoom['_id'], shouldLoadRoles: boolean): Array<string> => {
	const { data: userRoles } = useUserRolesQuery({
		select: useCallback((records: UserRoles[]) => records.find((record) => record.uid === userId)?.roles ?? [], [userId]),
		enabled: shouldLoadRoles && !!userId,
	});

	const { data: roomRoles } = useRoomRolesQuery(roomId, {
		select: useCallback((records: RoomRoles[]) => records.find((record) => record.u._id === userId)?.roles ?? [], [userId]),
		enabled: shouldLoadRoles && !!userId,
	});

	const predicate = useCallback(
		(record: IRole): boolean => {
			return !!record.description && [...(userRoles ?? []), ...(roomRoles ?? [])].includes(record._id);
		},
		[roomRoles, userRoles],
	);

	return Roles.use(useShallow((state) => state.filter(predicate).map(({ description }) => description)));
};
