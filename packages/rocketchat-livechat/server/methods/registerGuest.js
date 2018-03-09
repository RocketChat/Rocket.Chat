Meteor.methods({
	'livechat:registerGuest'({ token, name, email, department } = {}) {
		const userId = RocketChat.Livechat.registerGuest.call(this, {
			token,
			name,
			email,
			department
		});

		return {
			userId
		};
	}
});
