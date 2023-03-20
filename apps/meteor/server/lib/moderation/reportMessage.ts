import { Reports, Rooms, Users } from '@rocket.chat/models';
import type { IMessage, IUser } from '@rocket.chat/core-typings';

import { Messages } from '../../../app/models/server';
import { canAccessRoomAsync } from '../../../app/authorization/server/functions/canAccessRoom';
import { AppEvents, Apps } from '../../../app/apps/server';

export const reportMessage = async (messageId: IMessage['_id'], description: string, uid: IUser['_id']) => {
	if (!uid) {
		throw new Error('error-invalid-user');
	}

	if (description == null || description.trim() === '') {
		throw new Error('error-invalid-description');
	}

	const message = Messages.findOneById(messageId);

	if (!message) {
		throw new Error('error-invalid-message_id');
	}

	const user = await Users.findOneById(uid);

	if (!user) {
		throw new Error('error-invalid-user');
	}

	const { rid } = message;
	// If the user can't access the room where the message is, report that the message id is invalid
	const room = await Rooms.findOneById(rid);
	if (!room || !(await canAccessRoomAsync(room, { _id: uid }))) {
		throw new Error('error-invalid-message_id');
	}

	const reportedBy = {
		_id: user._id,
		username: user.username,
		name: user.name,
		active: user.active,
		avatarETag: user.avatarETag,
		createdAt: user.createdAt,
	};

	const roomInfo = {
		_id: rid,
		name: room.name,
		t: room.t,
		federated: room.federated,
		fname: room.fname,
	};

	await Reports.createWithMessageDescriptionAndUserId(message, description, roomInfo, reportedBy);

	Promise.await(Apps.triggerEvent(AppEvents.IPostMessageReported, message, user, description));

	return true;
};
