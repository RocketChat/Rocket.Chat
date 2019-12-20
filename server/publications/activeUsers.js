import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';

Meteor.publish('activeUsers', function() {
	console.warn('The publication "activeUsers" is deprecated and will be removed after version v3.0.0');
	if (!this.userId) {
		return this.ready();
	}

	return Users.findUsersNotOffline({
		fields: {
			username: 1,
			name: 1,
			status: 1,
			utcOffset: 1,
			statusText: 1,
		},
	});
});
