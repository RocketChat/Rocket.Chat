import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'e2e.requestSubscriptionKeys'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'requestSubscriptionKeys',
			});
		}

		// Get all encrypted rooms that the user is subscribed to

		const subscriptions = RocketChat.models.Subscriptions.findByUserId(Meteor.userId());
		const roomIds = subscriptions.map((subscription) => subscription.rid);

		const query = {
			e2eKeyId : {
				$exists: true,
			},
			_id : {
				$in: roomIds,
			},
		};

		const rooms = RocketChat.models.Rooms.find(query);
		rooms.forEach((room) => {
			RocketChat.Notifications.notifyRoom('e2e.keyRequest', room._id, room.e2eKeyId);
		});

		return true;
	},
});
