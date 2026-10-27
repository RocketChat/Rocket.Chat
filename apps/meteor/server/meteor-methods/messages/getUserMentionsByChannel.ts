import { ClientSafeError } from '@rocket.chat/core-services';
import { Messages, Users, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';

import { canAccessRoomAsync } from '../../lib/authorization';

export const getUserMentionsByChannel = async (
	userId: string,
	roomId: string,
	options: { limit?: number; skip?: number; sort?: { ts?: -1 | 1 } },
) => {
	check(roomId, String);

	const user = await Users.findOneById(userId);
	if (!user) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user');
	}

	const room = await Rooms.findOneById(roomId);

	if (!room || !(await canAccessRoomAsync(room, user))) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', {
			method: 'getUserMentionsByChannel',
		});
	}

	return Messages.findVisibleByMentionAndRoomId(user.username, roomId, options).toArray();
};
