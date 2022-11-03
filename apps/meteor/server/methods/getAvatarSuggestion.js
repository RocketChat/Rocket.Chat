import { Meteor } from 'meteor/meteor';

import { getAvatarSuggestionForUser } from '../../app/lib/server/functions/getAvatarSuggestionForUser';

Meteor.methods({
	async getAvatarSuggestion() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getAvatarSuggestion',
			});
		}

		const user = Meteor.user();

		return getAvatarSuggestionForUser(user);
	},
});
