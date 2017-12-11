Meteor.methods({
	'livechat:registerGuest'({ token, name, email, department } = {}) {
		const stampedToken = Accounts._generateStampedLoginToken();
		const hashStampedToken = Accounts._hashStampedToken(stampedToken);

		const userId = RocketChat.Livechat.registerGuest.call(this, {
			token,
			name,
			email,
			department,
			loginToken: hashStampedToken
		});

		// update visited page history to not expire
		RocketChat.models.LivechatPageVisited.keepHistoryForToken(token);

		return {
			userId,
			token: stampedToken.token
		};
	}
});
