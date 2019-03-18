import { Meteor } from 'meteor/meteor';
import { Rooms, Subscriptions } from '../../app/models';

Meteor.methods({
	'userActivityCounter.set' : (roomId) => {
		const now = new Date();
		const roomUsers = Meteor.call('getUsersOfRoom', roomId, true);

		const userActivity = roomUsers.records.map(function(user) {
			return {
				_id : user._id,
				messageCount : 0,
				reactions : 0,
				topicsCreated : 0,
				replies : 0,
			};
		});

		const roomCustomFields = {
			userActivityCounterFlag : true,
			lastUpdated : now,
			userActivity,
		};

		const ret = Rooms.setCustomFieldsById(roomId, roomCustomFields);
		Subscriptions.updateCustomFieldsByRoomId(roomId, roomCustomFields);

		return ret;
	},
});
