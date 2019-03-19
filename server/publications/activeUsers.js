import { Meteor } from 'meteor/meteor';
import { Users } from '../../app/models';

Meteor.publish('activeUsers', function() {
	if (!this.userId) {
		return this.ready();
	}

	return Users.findUsersNotOffline({
		fields: {
			username: 1,
			name: 1,
			status: 1,
			utcOffset: 1,
			type: 1,
		},
	});
});
