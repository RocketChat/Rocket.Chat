RocketChat.models.Users.getLoginTokensByUserId = function(userId) {
	const query = {
		'services.resume.loginTokens.type': {
			$exists: true,
			$eq: 'personalAccessToken',
		},
		_id: userId,
	};

	return this.find(query, { fields: { 'services.resume.loginTokens': 1 } });
};

RocketChat.models.Users.addPersonalAccessTokenToUser = function({ userId, loginTokenObject }) {
	return this.update(userId, {
		$push: {
			'services.resume.loginTokens': loginTokenObject,
		},
	});
};

RocketChat.models.Users.removePersonalAccessTokenOfUser = function({ userId, loginTokenObject }) {
	return this.update(userId, {
		$pull: {
			'services.resume.loginTokens': loginTokenObject,
		},
	});
};

RocketChat.models.Users.findPersonalAccessTokenByTokenNameAndUserId = function({ userId, tokenName }) {
	const query = {
		'services.resume.loginTokens': {
			$elemMatch: { name: tokenName, type: 'personalAccessToken' },
		},
		_id: userId,
	};

	return this.findOne(query);
};

