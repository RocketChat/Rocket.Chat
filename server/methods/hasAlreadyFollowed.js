import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';
import { settings } from '../../app/settings';

Meteor.methods({
	hasAlreadyFollowed(username) {
		if (settings.get('Newsfeed_enabled')) {
			if ('followers' in Users.findOneByUsername(username)) {
				if (`${ Meteor.user()._id }` in Users.findOneByUsername(username).followers) {
					return true;
				}
			}
		}
		return false;
	},
});
