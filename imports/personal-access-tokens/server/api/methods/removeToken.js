import { Meteor } from 'meteor/meteor';

Meteor.methods({
	'personalAccessTokens:removeToken'({ tokenName }) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:removeToken' });
		}

		RocketChat.Services.call('personalAccessTokens.removeToken', { tokenName, uid });
	},
});
