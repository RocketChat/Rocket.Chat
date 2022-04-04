import { Meteor } from 'meteor/meteor';

import { ChatSubscription } from '../../app/models/client';

Meteor.methods({
	toggleFavorite(rid, f) {
		if (!Meteor.userId()) {
			return false;
		}

		ChatSubscription.update(
			{
				rid,
				'u._id': Meteor.userId(),
			},
			{
				$set: {
					f,
				},
			},
		);
	},
});
