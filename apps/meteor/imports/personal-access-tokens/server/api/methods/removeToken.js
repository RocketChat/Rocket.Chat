import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { Users } from '../../../../../app/models';
import { twoFactorRequired } from '../../../../../app/2fa/server/twoFactorRequired';

Meteor.methods({
	'personalAccessTokens:removeToken': twoFactorRequired(function ({ tokenName }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', {
				method: 'personalAccessTokens:removeToken',
			});
		}
		if (!hasPermission(Meteor.userId(), 'create-personal-access-tokens')) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', {
				method: 'personalAccessTokens:removeToken',
			});
		}
		const tokenExist = Users.findPersonalAccessTokenByTokenNameAndUserId({
			userId: Meteor.userId(),
			tokenName,
		});
		if (!tokenExist) {
			throw new Meteor.Error('error-token-does-not-exists', 'Token does not exist', {
				method: 'personalAccessTokens:removeToken',
			});
		}
		Users.removePersonalAccessTokenOfUser({
			userId: Meteor.userId(),
			loginTokenObject: {
				type: 'personalAccessToken',
				name: tokenName,
			},
		});
	}),
});
