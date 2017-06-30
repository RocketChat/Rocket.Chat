Meteor.methods({
	'livechat:loginByToken'(token) {
		const user = RocketChat.models.Users.getVisitorByToken(token, { fields: { _id: 1 } });

		if (!user) {
			return;
		}

		const stampedToken = Accounts._generateStampedLoginToken();
		const hashStampedToken = Accounts._hashStampedToken(stampedToken);

		const updateUser = {
			$set: {
				services: {
					resume: {
						loginTokens: [ hashStampedToken ]
					}
				}
			}
		};

		Meteor.users.update(user._id, updateUser);

		return {
			token: stampedToken.token
		};
	}
});
