import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';

import { hasPermission } from '../../../../../app/authorization';
import { Users } from '../../../../../app/models';
import { twoFactorRequired } from '../../../../../app/2fa/server/twoFactorRequired';

Meteor.methods({
	'personalAccessTokens:generateToken': twoFactorRequired(function ({ tokenName, bypassTwoFactor }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', {
				method: 'personalAccessTokens:generateToken',
			});
		}
		if (!hasPermission(Meteor.userId(), 'create-personal-access-tokens')) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', {
				method: 'personalAccessTokens:generateToken',
			});
		}

		const token = Random.secret();
		const tokenExist = Users.findPersonalAccessTokenByTokenNameAndUserId({
			userId: Meteor.userId(),
			tokenName,
		});
		if (tokenExist) {
			throw new Meteor.Error('error-token-already-exists', 'A token with this name already exists', {
				method: 'personalAccessTokens:generateToken',
			});
		}

		Users.addPersonalAccessTokenToUser({
			userId: Meteor.userId(),
			loginTokenObject: {
				hashedToken: Accounts._hashLoginToken(token),
				type: 'personalAccessToken',
				createdAt: new Date(),
				lastTokenPart: token.slice(-6),
				name: tokenName,
				bypassTwoFactor,
			},
		});
		return token;
	}),
});
