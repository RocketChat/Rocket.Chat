import type { IUser } from '../../../definition/IUser';
import type { IMessage } from '../../../definition/IMessage/IMessage';
import { Messages, Rooms } from '../../../app/models/server/raw';
import { canAccessRoomAsync } from '../../../app/authorization/server/functions/canAccessRoom';

export async function getMessageForUser(messageId: IMessage['_id'], uid: IUser['_id']): Promise<IMessage | undefined> {
	if (!uid) {
		throw new Error('error-invalid-user');
	}

	const message = await Messages.findOne(messageId);
	if (!message) {
		return;
	}

	// #ToDo: Remove this find and call canAccessRoomId once that is merged.
	const room = await Rooms.findOne(message.rid);
	if (!room) {
		throw new Error('error-not-allowed');
	}

	if (!(await canAccessRoomAsync(room, { _id: uid }))) {
		throw new Error('error-not-allowed');
	}

	return message;
}
