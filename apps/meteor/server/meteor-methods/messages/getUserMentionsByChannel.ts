import { Messages, Users, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../lib/authorization';

export const getUserMentionsByChannel = async (
	userId: string,
	roomId: string,
	options: { limit?: number; skip?: number; sort?: { ts?: -1 | 1 } },
) => {
	check(roomId, String);

	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	const room = await Rooms.findOneById(roomId);

	if (!room || !(await canAccessRoomAsync(room, user))) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'getUserMentionsByChannel',
		});
	}

	return Messages.findVisibleByMentionAndRoomId(user.username, roomId, options).toArray();
};
