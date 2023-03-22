import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { Users } from '../../../../../app/models/server';
import { twoFactorRequired } from '../../../../../app/2fa/server/twoFactorRequired';

Meteor.methods({
	'personalAccessTokens:regenerateToken': twoFactorRequired(async function ({ tokenName }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', {
				method: 'personalAccessTokens:regenerateToken',
			});
		}
		if (!(await hasPermissionAsync(Meteor.userId(), 'create-personal-access-tokens'))) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', {
				method: 'personalAccessTokens:regenerateToken',
			});
		}

		const tokenExist = Users.findPersonalAccessTokenByTokenNameAndUserId({
			userId: Meteor.userId(),
			tokenName,
		});
		if (!tokenExist) {
			throw new Meteor.Error('error-token-does-not-exists', 'Token does not exist', {
				method: 'personalAccessTokens:regenerateToken',
			});
		}

		Meteor.call('personalAccessTokens:removeToken', { tokenName });
		return Meteor.call('personalAccessTokens:generateToken', {
			tokenName,
			bypassTwoFactor: tokenExist.bypassTwoFactor,
		});
	}),
});
