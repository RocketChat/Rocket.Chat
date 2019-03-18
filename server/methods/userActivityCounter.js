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

    'userActivityCounter.update' : (roomId, userActivity) => {
		const now = new Date();
		console.log(userActivity);
		const roomCustomFields = {
			userActivityCounterFlag : true,
			lastUpdated : now,
			userActivity,
		};

		const ret = Rooms.setCustomFieldsById(roomId, roomCustomFields);
		Subscriptions.updateCustomFieldsByRoomId(roomId, roomCustomFields);

		return ret;
	},

	'userActivityCounter.incrementMessageCount' : (roomId, userId) => {
		console.log('updating Count');
		const room = Rooms.findOne(roomId);
		let { userActivity } = room.customFields;
		userActivity = userActivity.map((userObject) => {
            console.log(userObject);
			if (userObject._id === userId) {
				userObject.messageCount += 1;
			}
			return userObject;
        });

		Meteor.call('userActivityCounter.update', roomId, userActivity);
	},
});
