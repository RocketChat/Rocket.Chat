import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { IUser } from '@rocket.chat/core-typings';

import { addUserToDefaultChannels } from '../functions';

Meteor.methods({
	joinDefaultChannels(silenced) {
		check(silenced, Match.Optional(Boolean));
		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'joinDefaultChannels',
			});
		}
		return addUserToDefaultChannels(user as IUser, Boolean(silenced));
	},
});
