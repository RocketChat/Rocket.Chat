import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Rooms, Messages } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';

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
			await Messages.createRoomSetReadOnlyByRoomIdAndUser(rid, user, settings.get('Message_Read_Receipt_Enabled'));
		} else {
			await Messages.createRoomRemovedReadOnlyByRoomIdAndUser(rid, user, settings.get('Message_Read_Receipt_Enabled'));
		}
	}
	return result;
}
