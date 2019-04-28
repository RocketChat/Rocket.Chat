import { Meteor } from 'meteor/meteor';
import { getFullUserData } from '../../app/lib';

Meteor.publish('fullUserData', function(filter, limit) {
	if (!this.userId) {
		return this.ready();
	}

	const result = getFullUserData({
		userId: this.userId,
		filter,
		limit,
	});

	if (!result) {
		return this.ready();
	}

	return result;
});
