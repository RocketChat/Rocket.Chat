import { Meteor } from 'meteor/meteor';

import { getAvatarSuggestionForUser } from '../../app/lib';

Meteor.methods({
	getAvatarSuggestion() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getAvatarSuggestion',
			});
		}

		this.unblock();

		const user = Meteor.user();

		return getAvatarSuggestionForUser(user);
	},
});
