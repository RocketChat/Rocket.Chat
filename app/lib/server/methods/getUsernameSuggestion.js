import { Meteor } from 'meteor/meteor';

import { generateUsernameSuggestion } from '../functions';

Meteor.methods({
	getUsernameSuggestion() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getUsernameSuggestion',
			});
		}

		const user = Meteor.user();

		return generateUsernameSuggestion(user);
	},
});
