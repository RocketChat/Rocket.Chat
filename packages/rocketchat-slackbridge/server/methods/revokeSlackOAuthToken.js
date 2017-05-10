
Meteor.methods({
	revokeSlackOAuthToken() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'requestSlackOAuthToken' });
		}

		const user = Meteor.user();
		const data = {
			token: user.settings.slack.access_token
		};

		HTTP.post('https://slack.com/api/auth.revoke', { params: data });

		RocketChat.models.Users.unsetSlack(Meteor.userId(), null);
	}
});
