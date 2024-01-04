import { Message } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { isRegisterUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { UpdateResult } from 'mongodb';

export const saveRoomEncrypted = async function (rid: string, encrypted: boolean, user: IUser, sendMessage = true): Promise<UpdateResult> {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomEncrypted',
		});
	}

	if (!isRegisterUser(user)) {
		throw new Meteor.Error('invalid-user', 'Invalid user', {
			function: 'RocketChat.saveRoomEncrypted',
		});
	}

	const update = await Rooms.saveEncryptedById(rid, encrypted);
	if (update && sendMessage) {
		const type = encrypted ? 'room_e2e_enabled' : 'room_e2e_disabled';

		await Message.saveSystemMessage(type, rid, user.username, user);
	}

	if (encrypted) {
		await Subscriptions.disableAutoTranslateByRoomId(rid);
	}
	return update;
};
