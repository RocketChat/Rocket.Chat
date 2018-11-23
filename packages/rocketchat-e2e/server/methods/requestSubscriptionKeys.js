import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'e2e.requestSubscriptionKeys'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'requestSubscriptionKeys',
			});
		}

		// Get all encrypted rooms that the user is subscribed to and has no E2E key yet
		const subscriptions = RocketChat.models.Subscriptions.findByUserIdWithoutE2E(Meteor.userId());
		const roomIds = subscriptions.map((subscription) => subscription.rid);

		// For all subscriptions without E2E key, get the rooms that have encryption enabled
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
