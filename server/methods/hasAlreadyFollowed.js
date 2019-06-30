import { Meteor } from 'meteor/meteor';

import { Users, UserRelations } from '../../app/models';
import { settings } from '../../app/settings';

Meteor.methods({
	hasAlreadyFollowed(username) {
		if (!settings.get('Newsfeed_enabled')) {
			return false;
		}

		const { _id: followingId } = Users.findOneByUsername(username, { fields: { _id: 1 } });

		if (UserRelations.find({ following: followingId, follower: Meteor.userId() }, { limit: 1 }).fetch()[0]) {
			return true;
		}
		return false;
	},
});
