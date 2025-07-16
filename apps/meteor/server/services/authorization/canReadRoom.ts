import type { RoomAccessValidator } from '@rocket.chat/core-services';
import { Authorization } from '@rocket.chat/core-services';
import { Subscriptions } from '@rocket.chat/models';

import { canAccessRoom } from './canAccessRoom';

export const canReadRoom: RoomAccessValidator = async (...args) => {
	if (!(await canAccessRoom(...args))) {
		return false;
	}

	const [room, user] = args;

	if (
		user?._id &&
		room?.t === 'c' &&
		!(await Authorization.hasPermission(user._id, 'preview-c-room')) &&
		!(await Subscriptions.findOneByRoomIdAndUserId(room?._id, user._id, { projection: { _id: 1 } }))
	) {
		return false;
	}

	return true;
};
