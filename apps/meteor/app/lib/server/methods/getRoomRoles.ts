import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import type { RoomRoles } from '../../../../server/lib/roles/getRoomRoles';
import { getRoomRoles } from '../../../../server/lib/roles/getRoomRoles';
import { canAccessRoomAsync } from '../../../authorization/server';
import { settings } from '../../../settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getRoomRoles(rid: IRoom['_id']): RoomRoles[];
	}
}

export const executeGetRoomRoles = async (rid: IRoom['_id'], fromUser?: IUser | null) => {
	check(rid, String);

	if (!fromUser && settings.get('Accounts_AllowAnonymousRead') === false) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomRoles' });
	}

	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getRoomRoles' });
	}

	if (fromUser && !(await canAccessRoomAsync(room, fromUser))) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomRoles' });
	}

	return getRoomRoles(rid);
};
