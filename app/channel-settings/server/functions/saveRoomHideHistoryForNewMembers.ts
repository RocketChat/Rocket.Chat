import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import type { WriteOpResult } from 'mongodb';

import { Rooms, Messages } from '../../../models/server';
import type { IUser } from '../../../../definition/IUser';

export const saveRoomHideHistoryForNewMembers = function(rid: string, hideHistory: boolean, user: IUser, sendMessage = true): Promise<WriteOpResult> {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomHideHistoryForNewMembers',
		});
	}

	const update = Rooms.saveHideHistoryForNewMembers(rid, hideHistory);
	if (update && sendMessage) {
		const messageType = hideHistory ? 'room_history_disabled' : 'room_history_enabled';
		Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser(messageType, rid, user.username, user, {});
	}
	return update;
};
