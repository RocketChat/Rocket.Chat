import type { RoomAccessValidator } from '@rocket.chat/core-services';
import { Authorization } from '@rocket.chat/core-services';
import { Subscriptions, Users } from '@rocket.chat/models';

import { canAccessRoom, isPartialUser } from './canAccessRoom';

export const canReadRoom: RoomAccessValidator = async (...args) => {
	const [room, user] = args;
	const userArgument = isPartialUser(user) ? await Users.findOneById(user._id) : user;

	if (!(await canAccessRoom(...args))) {
		return false;
	}

	if (
		userArgument &&
		room?.t === 'c' &&
		!(await Authorization.hasPermission(userArgument, 'preview-c-room')) &&
		!(await Subscriptions.findOneByRoomIdAndUserId(room?._id, userArgument._id, { projection: { _id: 1 } }))
	) {
		return false;
	}

	return true;
};
