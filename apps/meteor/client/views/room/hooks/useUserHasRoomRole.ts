import { IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import { UseQueryResult } from '@tanstack/react-query';

import { useReactiveQuery } from '../../../hooks/useReactiveQuery';

export const useUserHasRoomRole = (uid: IUser['_id'], rid: IRoom['_id'], role: IRole['name']): UseQueryResult<boolean, Error> =>
	useReactiveQuery(
		['rooms', rid, 'users', uid, 'roles', { role }],
		({ roomRoles }) => roomRoles.find({ rid, 'u._id': uid, 'roles': role }).count() > 0,
	);
