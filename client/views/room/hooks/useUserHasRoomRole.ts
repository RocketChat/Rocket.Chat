import { useCallback } from 'react';

import { RoomRoles } from '../../../../app/models/client';
import { IRole } from '../../../../definition/IRole';
import { IRoom } from '../../../../definition/IRoom';
import { IUser } from '../../../../definition/IUser';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

export const useUserHasRoomRole = (uid: IUser['_id'], rid: IRoom['_id'], role: IRole['name']): boolean =>
	useReactiveValue(useCallback(() => !!RoomRoles.findOne({ rid, 'u._id': uid, 'roles': role }), [uid, rid, role]));
