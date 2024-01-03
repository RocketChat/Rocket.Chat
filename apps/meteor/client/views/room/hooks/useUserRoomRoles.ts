import type { IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { RoomRoles } from '../../../../app/models/client';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

export const useUserRoomRoles = (uid: IUser['_id'], rid: IRoom['_id']): IRole['name'][] => {
	return useReactiveValue(useCallback(() => RoomRoles.findOne({ rid, 'u._id': uid })?.roles || [], [uid, rid]));
};
