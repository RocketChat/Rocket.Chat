import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

import { useRoomRolesQuery } from '../../../../hooks/useRoomRolesQuery';
import { useUserRolesQuery } from '../../../../hooks/useUserRolesQuery';
import { Roles } from '../../../../stores';

const noRoles: string[] = [];

/** The role descriptions to show next to each author of a room's messages, resolved once for the whole list */
export const useMessageRolesLookup = (rid: IRoom['_id'], enabled: boolean): ((userId: IUser['_id']) => string[]) => {
	const { data: userRoles } = useUserRolesQuery({ enabled });
	const { data: roomRoles } = useRoomRolesQuery(rid, { enabled });
	const describedRoles = Roles.use(useShallow((state) => state.filter((role) => !!role.description)));

	return useMemo(() => {
		const roleIdsByUser = new Map<IUser['_id'], Set<string>>();
		const addRoles = (userId: IUser['_id'], roleIds: string[]) => {
			const userRoleIds = roleIdsByUser.get(userId) ?? new Set<string>();
			roleIds.forEach((roleId) => userRoleIds.add(roleId));
			roleIdsByUser.set(userId, userRoleIds);
		};

		userRoles?.forEach(({ uid, roles }) => addRoles(uid, roles));
		roomRoles?.forEach(({ u, roles }) => addRoles(u._id, roles));

		const descriptionsByUser = new Map<IUser['_id'], string[]>();

		return (userId) => {
			const roleIds = roleIdsByUser.get(userId);
			if (!roleIds) {
				return noRoles;
			}

			let descriptions = descriptionsByUser.get(userId);
			if (!descriptions) {
				descriptions = describedRoles.filter(({ _id }) => roleIds.has(_id)).map(({ description }) => description);
				descriptionsByUser.set(userId, descriptions);
			}
			return descriptions;
		};
	}, [userRoles, roomRoles, describedRoles]);
};
