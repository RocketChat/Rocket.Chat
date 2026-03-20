import { Rooms, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../app/authorization/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { unbanUserFromRoom } from '../../app/lib/server/functions/unbanUserFromRoom';

export const unbanUserFromRoomMethod = async (fromId: string, data: { rid: string; username: string }): Promise<boolean> => {
	if (!(await hasPermissionAsync(fromId, 'ban-user', data.rid))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'unbanUserFromRoom',
		});
	}

	const room = await Rooms.findOneById(data.rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'unbanUserFromRoom',
		});
	}

	const fromUser = await Users.findOneById(fromId);
	if (!fromUser) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'unbanUserFromRoom',
		});
	}

	if (!(await canAccessRoomAsync(room, fromUser))) {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
	}

	const bannedUser = await Users.findOneByUsernameIgnoringCase(data.username);
	if (!bannedUser) {
		throw new Meteor.Error('error-user-not-found', 'User not found', {
			method: 'unbanUserFromRoom',
		});
	}

	await unbanUserFromRoom(data.rid, bannedUser, { byUser: fromUser });

	return true;
};
