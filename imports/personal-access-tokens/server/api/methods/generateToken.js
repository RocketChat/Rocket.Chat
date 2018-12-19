import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';

Meteor.methods({
	'personalAccessTokens:generateToken'({ tokenName }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:generateToken' });
		}
		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-personal-access-tokens')) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:generateToken' });
		}

		const token = Random.secret();
		const tokenExist = RocketChat.models.Users.findPersonalAccessTokenByTokenNameAndUserId({
			userId: Meteor.userId(),
			tokenName,
		});
		if (tokenExist) {
			throw new Meteor.Error('error-token-already-exists', 'A token with this name already exists', { method: 'personalAccessTokens:generateToken' });
		}

		RocketChat.models.Users.addPersonalAccessTokenToUser({
			userId: Meteor.userId(),
			loginTokenObject: {
				hashedToken: Accounts._hashLoginToken(token),
				type: 'personalAccessToken',
				createdAt: new Date(),
				lastTokenPart: token.slice(-6),
				name: tokenName,
			},
		});
		return token;
	},
});
