import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';
import { settings } from '../../app/settings';


Meteor.methods({
	getFollowers(username) {
		if (settings.get('Newsfeed_enabled')) {
			const userObject = Users.findOneByUsername(username);
			if ('followers' in userObject) {
				return userObject.followers;
			}
		}

		return false;
	},
});
