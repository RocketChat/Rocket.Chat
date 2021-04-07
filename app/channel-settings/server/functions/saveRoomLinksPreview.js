import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms } from '../../../models';
import { hasPermission } from '../../../authorization';

export const saveRoomLinksPreview = function(rid, value) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomLinksPreview',
		});
	}
	return Rooms.saveLinksPreview(rid, value, hasPermission);
};
