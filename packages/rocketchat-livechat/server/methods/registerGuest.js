Meteor.methods({
	'livechat:registerGuest'({ token, name, email, department } = {}) {
		const userId = RocketChat.Livechat.registerGuest.call(this, {
			token,
			name,
			email,
			department
		});

		// update visited page history to not expire
		RocketChat.models.Messages.keepHistoryForToken(token);

		return {
			userId
		};
	}
});
