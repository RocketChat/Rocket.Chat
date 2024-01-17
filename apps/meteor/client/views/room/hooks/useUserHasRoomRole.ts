import type { IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { RoomRoles } from '../../../../app/models/client';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

export const useUserHasRoomRole = (uid: IUser['_id'], rid: IRoom['_id'], role: IRole['name']): boolean =>
	useReactiveValue(useCallback(() => !!RoomRoles.findOne({ rid, 'u._id': uid, 'roles': role }), [uid, rid, role]));
