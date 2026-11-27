import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { canAccessRoomIdAsync } from '../authorization/canAccessRoom';
import { hasPermissionAsync } from '../authorization/hasPermission';

/** Whether the user may rename or delete the links of a room: they can see the room and manage its calls. */
export const canManageConferenceRoom = async (user: Pick<IUser, '_id' | 'roles'>, rid: IRoom['_id']): Promise<boolean> =>
	(await canAccessRoomIdAsync(rid, user._id)) && hasPermissionAsync(user, 'call-management', rid);
