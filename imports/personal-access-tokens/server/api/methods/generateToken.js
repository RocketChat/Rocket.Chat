import { Meteor } from 'meteor/meteor';

Meteor.methods({
	'personalAccessTokens:generateToken'({ tokenName }) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:generateToken' });
		}
		if (!RocketChat.authz.hasPermission(uid, 'create-personal-access-tokens')) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:generateToken' });
		}
		return RocketChat.Services.call('personalAccessTokens.regenerateToken', { tokenName, uid });

	},
});
