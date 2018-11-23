import { Meteor } from 'meteor/meteor';

Meteor.methods({
	'personalAccessTokens:regenerateToken'({ tokenName }) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:regenerateToken' });
		}

		return RocketChat.Services.call('personalAccessTokens.regenerateToken', { tokenName, uid });
	},
});
