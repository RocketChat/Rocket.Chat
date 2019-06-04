import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';
import { settings } from '../../app/settings';

Meteor.methods({
	hasAlreadyFollowed(username) {
		if (settings.get('Newsfeed_enabled')) {
			if (Users.findOneByUsername(username).followers) {
				if (Users.findOneByUsername(username).followers.indexOf(Meteor.user().username) !== -1) {
					return true;
				}
			}
		}
		return false;
	},
});
