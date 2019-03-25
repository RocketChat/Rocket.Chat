import { Meteor } from 'meteor/meteor';
import { hasPermission } from '../../../../../app/authorization';
import { Users } from '../../../../../app/models';

Meteor.methods({
	'personalAccessTokens:regenerateToken'({ tokenName }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:regenerateToken' });
		}
		if (!hasPermission(Meteor.userId(), 'create-personal-access-tokens')) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:regenerateToken' });
		}

		const tokenExist = Users.findPersonalAccessTokenByTokenNameAndUserId({
			userId: Meteor.userId(),
			tokenName,
		});
		if (!tokenExist) {
			throw new Meteor.Error('error-token-does-not-exists', 'Token does not exist', { method: 'personalAccessTokens:regenerateToken' });
		}

		Meteor.call('personalAccessTokens:removeToken', { tokenName });
		return Meteor.call('personalAccessTokens:generateToken', { tokenName });
	},
});
