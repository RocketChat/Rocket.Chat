import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';
import { settings } from '../../app/settings';


Meteor.methods({
	unfollowUser(username) {
		if (settings.get('Newsfeed_enabled')) {
			Users.update(Users.findOneByUsername(username)._id, { $pull: { followers: Meteor.user().username } });
			Users.update(Users.findOneByUsername(Meteor.user().username)._id, { $pull: { following: username } });
			return true;
		}

		return false;
	},
});
