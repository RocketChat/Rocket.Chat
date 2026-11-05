import { ClientSafeError } from '@rocket.chat/core-services';
import { isRegisterUser } from '@rocket.chat/core-typings';
import { Users, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';

import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { archiveRoom } from '../../lib/rooms/archiveRoom';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

export const executeArchiveRoom = async (userId: string, rid: string) => {
	check(rid, String);

	const user = await Users.findOneById(userId, { projection: { username: 1, name: 1 } });
	if (!user || !isRegisterUser(user)) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
	}

	const room = await Rooms.findOneById(rid);
	if (!room) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'archiveRoom' });
	}

	if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.ARCHIVE, userId))) {
		throw new ClientSafeError('error-direct-message-room', `rooms type: ${room.t} can not be archived`, { method: 'archiveRoom' });
	}

	if (!(await hasPermissionAsync(userId, 'archive-room', room._id))) {
		throw new ClientSafeError('error-not-authorized', 'Not authorized', { method: 'archiveRoom' });
	}

	return archiveRoom(rid, user);
};
