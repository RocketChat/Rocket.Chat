import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms } from '../../../models';
import { hasPermission } from '../../../authorization';

export const saveRoomReadOnly = function(rid, readOnly) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomReadOnly',
		});
	}
	return Rooms.setReadOnlyById(rid, readOnly, hasPermission);
};
