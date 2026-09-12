import type { IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import { useCallback } from 'react';
import { useShallow } from 'zustand/shallow';

import type { RoomRoles } from './useRoomRolesQuery';
import { useRoomRolesQuery } from './useRoomRolesQuery';
import type { UserRoles } from './useUserRolesQuery';
import { useUserRolesQuery } from './useUserRolesQuery';
import { Roles } from '../stores';

export const useUserRolesByScope = (
	userId: IUser['_id'] | undefined,
	roomId: IRoom['_id'],
	enabled = true,
): { workspaceRoles: string[]; roomRoles: string[] } => {
	const { data: userRoleIds } = useUserRolesQuery({
		select: useCallback((records: UserRoles[]) => records.find((record) => record.uid === userId)?.roles ?? [], [userId]),
		enabled: enabled && !!userId,
	});

	const { data: roomRoleIds } = useRoomRolesQuery(roomId, {
		select: useCallback((records: RoomRoles[]) => records.find((record) => record.u._id === userId)?.roles ?? [], [userId]),
		enabled: enabled && !!userId,
	});

	const belongsTo = (roleIds: IRole['_id'][] | undefined) => (record: IRole) => !!roleIds?.includes(record._id);
	// Custom roles are often created without a description; fall back to the name so they don't vanish.
	const label = ({ description, name }: IRole) => description || name;

	const workspaceRoles = Roles.use(useShallow((state) => state.filter(belongsTo(userRoleIds)).map(label)));
	const roomRoles = Roles.use(useShallow((state) => state.filter(belongsTo(roomRoleIds)).map(label)));

	return { workspaceRoles, roomRoles };
};
