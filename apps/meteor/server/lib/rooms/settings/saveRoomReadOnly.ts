import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

export async function saveRoomReadOnly(
	rid: string,
	readOnly: boolean,
	user: Required<Pick<IUser, '_id' | 'username' | 'name'>>,
	sendMessage = true,
) {
	const result = await Rooms.setReadOnlyById(rid, readOnly);

	if (result && sendMessage) {
		if (readOnly) {
			await Message.saveSystemMessage('room-set-read-only', rid, '', user);
		} else {
			await Message.saveSystemMessage('room-removed-read-only', rid, '', user);
		}
	}
	return result;
}
