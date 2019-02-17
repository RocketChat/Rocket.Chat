import { Meteor } from 'meteor/meteor';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Subscriptions } from 'meteor/rocketchat:models';

Meteor.publish('userChannels', function(userId) {
	if (!this.userId) {
		return this.ready();
	}

	if (hasPermission(this.userId, 'view-other-user-channels') !== true) {
		return this.ready();
	}

	return Subscriptions.findByUserId(userId, {
		fields: {
			rid: 1,
			name: 1,
			t: 1,
			u: 1,
		},
		sort: {
			t: 1,
			name: 1,
		},
	});
});
