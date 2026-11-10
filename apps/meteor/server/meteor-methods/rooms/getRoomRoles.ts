import { ClientSafeError } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import { canAccessRoomAsync } from '../../lib/authorization';
import type { RoomRoles } from '../../lib/roles/getRoomRoles';
import { getRoomRoles } from '../../lib/roles/getRoomRoles';
import { settings } from '../../settings';

declare module '@rocket.chat/ddp-client' {
	interface ServerMethods {
		getRoomRoles(rid: IRoom['_id']): RoomRoles[];
	}
}

export const executeGetRoomRoles = async (rid: IRoom['_id'], fromUser?: IUser | null) => {
	if (!fromUser && settings.get('Accounts_AllowAnonymousRead') === false) {
		throw new ClientSafeError('error-unauthenticated', 'Unauthenticated', { method: 'getRoomRoles' });
	}

	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'getRoomRoles' });
	}

	if (fromUser && !(await canAccessRoomAsync(room, fromUser))) {
		throw new ClientSafeError('error-not-authorized', 'Not authorized', { method: 'getRoomRoles' });
	}

	return getRoomRoles(rid);
};
