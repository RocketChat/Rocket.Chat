import { IMessage } from '../../../definition/IMessage';
import { IRoom } from '../../../definition/IRoom';
import { OutOfOfficeRooms, OutOfOfficeUsers } from '../../models/server';
import { executeSendMessage } from '../../lib/server/methods/sendMessage';
import { callbacks } from '../../callbacks/server';

async function sendMessageInRoomForUsers(
	userIds: string[],
	roomId: string,
): Promise<void> {
	const foundOutOfOfficeUsers = OutOfOfficeUsers.findEnabledByUserIds(userIds);

	for (const { customMessage, userId } of foundOutOfOfficeUsers) {
		const replyMessage = {
			msg: customMessage,
			rid: roomId,
		};
		executeSendMessage(userId, replyMessage);
	}
}

async function handlePostMessage(
	message: IMessage,
	room: IRoom,
): Promise<IMessage> {
	const foundOutOfOfficeRoom: { userIds: string[]; _id: string } = OutOfOfficeRooms.findOne({ roomId: room._id }, { fields: { userIds: 1 } });

	if (!foundOutOfOfficeRoom || foundOutOfOfficeRoom.userIds.length === 0) {
		return message;
	}

	sendMessageInRoomForUsers(foundOutOfOfficeRoom.userIds, room._id);

	OutOfOfficeRooms.removeById(foundOutOfOfficeRoom._id);

	return message;
}

callbacks.add(
	'afterSaveMessage',
	handlePostMessage,
	callbacks.priority.LOW,
	'out-of-office-post-message-handler',
);
