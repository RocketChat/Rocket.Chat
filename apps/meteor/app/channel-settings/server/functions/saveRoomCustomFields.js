import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms, Subscriptions } from '../../../models';

export const saveRoomCustomFields = function (rid, roomCustomFields) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomCustomFields',
		});
	}
	if (!Match.test(roomCustomFields, Object)) {
		throw new Meteor.Error('invalid-roomCustomFields-type', 'Invalid roomCustomFields type', {
			function: 'RocketChat.saveRoomCustomFields',
		});
	}
	const ret = Rooms.setCustomFieldsById(rid, roomCustomFields);

	// Update customFields of any user's Subscription related with this rid
	Subscriptions.updateCustomFieldsByRoomId(rid, roomCustomFields);

	return ret;
};
