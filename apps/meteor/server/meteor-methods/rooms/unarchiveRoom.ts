import { isRegisterUser } from '@rocket.chat/core-typings';
import { Users, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { unarchiveRoom } from '../../lib/rooms/unarchiveRoom';

export const executeUnarchiveRoom = async (userId: string, rid: string) => {
	check(rid, String);

	const user = await Users.findOneById(userId, { projection: { username: 1, name: 1 } });
	if (!user || !isRegisterUser(user)) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
	}

	const room = await Rooms.findOneById(rid);

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'unarchiveRoom' });
	}

	if (!(await hasPermissionAsync(userId, 'unarchive-room', room._id))) {
		throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'unarchiveRoom' });
	}

	return unarchiveRoom(rid, user);
};
