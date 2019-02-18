import { Meteor } from 'meteor/meteor';
import { Rooms } from 'meteor/rocketchat:models';

Meteor.methods({
	getTotalChannels() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getTotalChannels',
			});
		}

		const query = {
			t: 'c',
		};
		return Rooms.find(query).count();
	},
});
