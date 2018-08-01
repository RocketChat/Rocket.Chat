Meteor.methods({
	'personalAccessTokens:regenerateToken'({ tokenName }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:regenerateToken'});
		}
		if (!RocketChat.settings.get('API_Enable_Personal_Access_Tokens')) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:generateToken'});
		}

		const tokenExist = RocketChat.models.Users.findPersonalAccessTokenByTokenNameAndUserId({
			userId: Meteor.userId(),
			tokenName
		});
		if (!tokenExist) {
			throw new Meteor.Error('error-token-does-not-exists', 'Token does not exist', { method: 'personalAccessTokens:regenerateToken' });
		}

		Meteor.call('personalAccessTokens:removeToken', { tokenName });
		const token = Meteor.call('personalAccessTokens:generateToken', { tokenName });
		return token;
	}
});
