import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

import type { MessageListContextValue } from '../../../../components/message/list/MessageListContext';
import { useRoomRolesQuery } from '../../../../hooks/useRoomRolesQuery';
import { useUserRolesQuery } from '../../../../hooks/useUserRolesQuery';
import { Roles } from '../../../../stores';

type UserRolesLabels = { workspaceRoles: string[]; roomRoles: string[] };

const noRoles: UserRolesLabels = { workspaceRoles: [], roomRoles: [] };

/** The roles every message author holds, resolved once for the whole list instead of once per message header. */
export const useRolesByUser = (rid: IRoom['_id'], enabled: boolean): MessageListContextValue['userRoles'] => {
	const { data: roomRoles } = useRoomRolesQuery(rid, { enabled });
	const { data: userRoles } = useUserRolesQuery({ enabled });
	// roles without a description are not shown, matching what the role endpoints return
	const describedRoles = Roles.use(useShallow((state) => state.filter((record) => !!record.description)));

	return useMemo(() => {
		if (!enabled) {
			return undefined;
		}

		const workspaceRoleIds = new Map(userRoles?.map((record) => [record.uid, record.roles]));
		const roomRoleIds = new Map(roomRoles?.map((record) => [record.u._id, record.roles]));
		const labelsOf = (roleIds: string[] | undefined) =>
			roleIds?.length ? describedRoles.filter((record) => roleIds.includes(record._id)).map(({ description }) => description) : [];

		const byUser = new Map<IUser['_id'], UserRolesLabels>();

		return {
			rid,
			get: (uid) => {
				let labels = byUser.get(uid);
				if (!labels) {
					const workspaceRoles = labelsOf(workspaceRoleIds.get(uid));
					const roomRoles = labelsOf(roomRoleIds.get(uid));
					labels = workspaceRoles.length || roomRoles.length ? { workspaceRoles, roomRoles } : noRoles;
					byUser.set(uid, labels);
				}
				return labels;
			},
		};
	}, [enabled, rid, userRoles, roomRoles, describedRoles]);
};
