import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';
import { settings } from '../../app/settings';


Meteor.methods({
	unfollowUser(username) {
		if (settings.get('Newsfeed_enabled')) {
			// Update followers keys
			let userObject = Users.findOneByUsername(username);
			if ('followers' in userObject) {
				const followersObject = userObject.followers;
				const { _id } = Users.findOneByUsername(Meteor.user().username);
				delete followersObject[_id];
				Users.update(userObject._id, { $set: { followers: followersObject } });
			}

			// Update following keys
			userObject = Users.findOneByUsername(Meteor.user().username);
			if ('following' in userObject) {
				const followingObject = userObject.following;
				const { _id } = Users.findOneByUsername(username);
				delete followingObject[_id];
				Users.update(userObject._id, { $set: { following: followingObject } });
			}

			return true;
		}

		return false;
	},
});
