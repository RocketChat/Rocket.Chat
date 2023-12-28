import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

export async function saveRoomReadOnly(
	rid: string,
	readOnly: boolean,
	user: Required<Pick<IUser, '_id' | 'username' | 'name'>>,
	sendMessage = true,
) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomReadOnly',
		});
	}

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
