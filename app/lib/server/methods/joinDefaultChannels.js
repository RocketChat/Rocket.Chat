import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { addUserToDefaultChannels } from '../functions';

Meteor.methods({
	joinDefaultChannels(silenced) {
		check(silenced, Match.Optional(Boolean));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'joinDefaultChannels',
			});
		}
		return addUserToDefaultChannels(Meteor.user(), silenced);
	},
});
