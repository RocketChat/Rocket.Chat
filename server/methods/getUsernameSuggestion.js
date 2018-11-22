import { Meteor } from 'meteor/meteor';
Meteor.methods({
	getUsernameSuggestion() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getUsernameSuggestion',
			});
		}

		const user = Meteor.user();

		return RocketChat.Services.call('users.getUsernameSuggestion', { user });
	},
});
