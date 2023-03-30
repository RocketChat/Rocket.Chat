import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Rooms, Subscriptions } from '@rocket.chat/models';

export const saveRoomCustomFields = async function (rid, roomCustomFields) {
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
	const ret = await Rooms.setCustomFieldsById(rid, roomCustomFields);

	// Update customFields of any user's Subscription related with this rid
	await Subscriptions.updateCustomFieldsByRoomId(rid, roomCustomFields);

	return ret;
};
