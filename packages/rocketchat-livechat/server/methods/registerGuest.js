Meteor.methods({
	'livechat:registerGuest'({ token, name, email, department } = {}) {
		var stampedToken = Accounts._generateStampedLoginToken();
		var hashStampedToken = Accounts._hashStampedToken(stampedToken);

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
