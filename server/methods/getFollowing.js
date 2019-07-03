import { Meteor } from 'meteor/meteor';

import { UserRelations, Users } from '../../app/models';
import { settings } from '../../app/settings';


Meteor.methods({
	getFollowing(username) {
		if (!settings.get('Newsfeed_enabled')) {
			return false;
		}
		const { _id } = Users.findOneByUsername(username, { fields: { _id: 1 } });
		return UserRelations.find({ follower: _id }, { fields: { following: 1, _id: false } }).fetch();
	},
});
