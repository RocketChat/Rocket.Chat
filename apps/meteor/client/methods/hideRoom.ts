import { Meteor } from 'meteor/meteor';

import { Subscriptions } from '../../app/models/client';

Meteor.methods({
	hideRoom(rid) {
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
					alert: false,
					open: false,
				},
			},
		);
	},
});
