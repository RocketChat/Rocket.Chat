import type { IRole, IRoom, IUser } from '@rocket.chat/core-typings';

import { useRoomRolesStore } from '../../../hooks/useRoomRolesStore';

export const useUserHasRoomRole = (uid: IUser['_id'], rid: IRoom['_id'], role: IRole['name']): boolean =>
	useRoomRolesStore((state) => state.records.some((record) => record.rid === rid && record.u._id === uid && record.roles.includes(role)));
