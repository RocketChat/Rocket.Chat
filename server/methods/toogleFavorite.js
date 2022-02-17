import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Subscriptions } from '../../app/models';

Meteor.methods({
	toggleFavorite(rid, f) {
		check(rid, String);

		check(f, Match.Optional(Boolean));
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'toggleFavorite',
			});
		}

		const userSubscription = Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!userSubscription) {
			throw new Meteor.Error('error-invalid-subscription', 'You must be part of a room to favorite it', { method: 'toggleFavorite' });
		}

		return Subscriptions.setFavoriteByRoomIdAndUserId(rid, Meteor.userId(), f);
	},
});
