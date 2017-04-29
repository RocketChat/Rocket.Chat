import { Meteor } from 'meteor/meteor';

Meteor.publish('activeUsers', function() {
	if (!this.userId) {
		return this.ready();
	}

	if (RocketChat.authz.hasPermission(this.userId, 'view-user-list') !== true) {
		return RocketChat.models.Users.findUsersNotOfflineInSubscribedRooms(this.username, {
			fields: {
			username: 1,
			status: 1,
			utcOffset: 1
			}
		});
	}

	return RocketChat.models.Users.findUsersNotOffline({
		fields: {
			username: 1,
			name: 1,
			status: 1,
			utcOffset: 1,
		},
	});
});
