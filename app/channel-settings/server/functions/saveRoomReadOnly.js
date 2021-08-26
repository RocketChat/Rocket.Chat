import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms, Messages } from '../../../models';
import { hasPermission } from '../../../authorization';

export const saveRoomReadOnly = function(rid, readOnly, user, sendMessage = true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomReadOnly',
		});
	}
	const result = Rooms.setReadOnlyById(rid, readOnly, hasPermission);

	if (result && sendMessage) {
		if (!readOnly) {
			Messages.createRoomSetReadOnlyByRoomIdAndUser(rid, user);
		} else {
			Messages.createRoomRemovedReadOnlyByRoomIdAndUser(rid, user);
		}
	}
	return result;
};
