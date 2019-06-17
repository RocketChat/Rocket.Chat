import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';
import { settings } from '../../app/settings';


Meteor.methods({
	getFollowing(username) {
		if (settings.get('Newsfeed_enabled')) {
			const userObject = Users.findOneByUsername(username);
			if ('following' in userObject) {
				return userObject.following;
			}
		}

		return false;
	},
});
