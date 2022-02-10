import type { IUser } from '../../../definition/IUser';
import type { IMessage } from '../../../definition/IMessage/IMessage';
import { Messages } from '../../../app/models/server/raw';
import { canAccessRoomId } from '../../../app/authorization/server';

export async function getMessageForUser(messageId: IMessage['_id'], uid: IUser['_id']): Promise<IMessage | undefined> {
	if (!uid) {
		throw new Error('error-invalid-user');
	}

	const message = await Messages.findOne(messageId);
	if (!message) {
		return;
	}

	if (!canAccessRoomId(message.rid, uid)) {
		throw new Error('error-not-allowed');
	}

	return message;
}
