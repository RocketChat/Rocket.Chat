import { Meteor } from 'meteor/meteor';

import { Subscriptions } from '../../app/models/client';

Meteor.methods({
	toggleFavorite(rid, f) {
		if (!Meteor.userId()) {
			return false;
		}

		Subscriptions.update(
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
