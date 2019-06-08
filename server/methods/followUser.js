import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';
import { settings } from '../../app/settings';


Meteor.methods({
	followUser(username) {
		if (settings.get('Newsfeed_enabled')) {
			// Update followers keys
			let userObject = Users.findOneByUsername(username);
			if ('followers' in userObject) {
				const followersObject = userObject.followers;
				const { _id } = Users.findOneByUsername(Meteor.user().username);
				followersObject[_id] = '';
				Users.update(userObject._id, { $set: { followers: followersObject } });
			} else {
				const followersObject = new Object();
				const { _id } = Users.findOneByUsername(Meteor.user().username);
				followersObject[_id] = '';
				Users.update(userObject._id, { $set: { followers: followersObject } });
			}

			// Update following keys
			userObject = Users.findOneByUsername(Meteor.user().username);
			if ('following' in userObject) {
				const followingObject = userObject.following;
				const { _id } = Users.findOneByUsername(username);
				followingObject[_id] = '';
				Users.update(userObject._id, { $set: { following: followingObject } });
			} else {
				const followingObject = new Object();
				const { _id } = Users.findOneByUsername(username);
				followingObject[_id] = '';
				Users.update(userObject._id, { $set: { following: followingObject } });
			}

			return true;
		}

		return false;
	},
});
