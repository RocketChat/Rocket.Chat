import { Meteor } from 'meteor/meteor';

import { Users, UserRelations } from '../../app/models';
import { settings } from '../../app/settings';


Meteor.methods({
	getFollowers(username) {
		if (!settings.get('Newsfeed_enabled')) {
			return false;
		}
		const { _id } = Users.findOneByUsername(username, { fields: { _id: 1 } });
		return UserRelations.find({ following: _id }, { fields: { follower: 1, _id: false } }).fetch();
	},
});
