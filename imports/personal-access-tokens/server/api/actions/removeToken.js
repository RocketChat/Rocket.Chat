import { Meteor } from 'meteor/meteor';

export default {
	async removeToken(ctx) {
		const { uid, tokenName } = ctx.params;
		if (!await ctx.call('autorization.hasPermission', { uid, permission: 'create-personal-access-tokens' })) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'personalAccessTokens:removeToken' });
		}

		const tokenExist = RocketChat.models.Users.findPersonalAccessTokenByTokenNameAndUserId({
			userId: uid,
			tokenName,
		});

		if (!tokenExist) {
			throw new Meteor.Error('error-token-does-not-exists', 'Token does not exist', { method: 'personalAccessTokens:removeToken' });
		}

		RocketChat.models.Users.removePersonalAccessTokenOfUser({
			userId: uid,
			loginTokenObject: {
				type: 'personalAccessToken',
				name: tokenName,
			},
		});
	},
};
