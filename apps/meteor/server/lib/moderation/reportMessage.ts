import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Messages, ModerationReports, Rooms, Users } from '@rocket.chat/models';

import { canAccessRoomAsync } from '../../../app/authorization/server/functions/canAccessRoom';
import { AppEvents, Apps } from '../../../ee/server/apps';

export const reportMessage = async (messageId: IMessage['_id'], description: string, uid: IUser['_id']) => {
	if (!uid) {
		throw new Error('error-invalid-user');
	}

	if (!description.trim()) {
		throw new Error('error-invalid-description');
	}

	const message = await Messages.findOneById(messageId);

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
		createdAt: user.createdAt,
	};

	const roomInfo = {
		_id: rid,
		name: room.name,
		t: room.t,
		federated: room.federated,
		fname: room.fname,
	};

	await ModerationReports.createWithMessageDescriptionAndUserId(message, description, roomInfo, reportedBy);

	await Apps.triggerEvent(AppEvents.IPostMessageReported, message, user, description);

	return true;
};
